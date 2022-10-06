import session, { Store } from 'express-session';
import Redis from 'ioredis';
import mongoose from 'mongoose';
import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { MONGODB_URI } from '../configs/mongo-config';
import { REDIS_OPTIONS } from '../configs/redis-config';
import connectRedis from 'connect-redis';
import { createApp } from '../app';
import request from 'supertest';
import { IUser, userMongoModel } from '../infrastructure/tools & frameworks/mongo/user.mongo-model';

let app: ReturnType<typeof createApp>;

beforeAll(async () => {
    // connection to dbs:
    try {
        await mongoose.connect(MONGODB_URI).then(() => {
            console.log('(TEST) Connected to MongoDB successfully');
        });
    } catch (error) {
        console.log(`(TEST)Error while connecting to MongoDB: ${error}`);
        process.exit();
    }

    let sessionStore: Store;
    try {
        const RedisStore = connectRedis(session);
        const RedisClient = new Redis(REDIS_OPTIONS);
        sessionStore = new RedisStore({ client: RedisClient });
    } catch (error) {
        console.log(`Error while connecting to Redis: ${error}`);
        process.exit();
    }

    // initializing webserver here:
    app = createApp(sessionStore);
});

afterAll(async () => {
    await userMongoModel.deleteMany({});
});

// beforeEach(async () => {
//     await userMongoModel.deleteMany({})
// })

describe('API routes:', () => {
    describe('/register & /login', () => {
        // afterAll(async () => {
        //     await userMongoModel.deleteMany({});
        // });
        it('should register an "admin" user', async () => {
            const requestData = {
                username: 'admin1',
                password: 'somepassword!',
                firstName: 'Admin',
                lastName: 'User',
                role: 'admin',
            };

            const res = await request(app).post('/api/v1/users/register').send(requestData);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.username).toBe('admin1');
            expect(res.body.data.firstName).toBe('Admin');
            expect(res.body.data.lastName).toBe('User');
            expect(res.body.data.role).toBe(requestData.role.toUpperCase());
            expect(res.body.data).not.toHaveProperty('password');
            expect(res.body.data).not.toHaveProperty('subordinates');
            expect(res.body.data).not.toHaveProperty('boss');
            expect(res.body.data).toHaveProperty('createdAt');
            expect(res.body.data).toHaveProperty('updatedAt');
        });
        it('should register a "regular" user', async () => {
            const requestData = {
                username: 'regular1',
                password: 'somepassword!',
                firstName: 'Regular',
                lastName: 'User',
                role: 'regular',
            };

            const res = await request(app).post('/api/v1/users/register').send(requestData);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.username).toBe('regular1');
            expect(res.body.data.firstName).toBe('Regular');
            expect(res.body.data.lastName).toBe('User');
            expect(res.body.data.role).toBe(requestData.role.toUpperCase());
            expect(res.body.data).not.toHaveProperty('password');
            expect(res.body.data).not.toHaveProperty('subordinates');
            expect(res.body.data).toHaveProperty('createdAt');
            expect(res.body.data).toHaveProperty('updatedAt');
        });
        it('should register a "boss" user', async () => {
            const regUserTestData1 = {
                username: 'regular2',
                password: 'somepassword!',
                role: 'regular',
            };
            const regUserTestData2 = {
                username: 'regular3',
                password: 'somepassword!',
                role: 'regular',
            };
            await request(app).post('/api/v1/users/register').send(regUserTestData1);
            await request(app).post('/api/v1/users/register').send(regUserTestData2);

            const bossRequestData = {
                username: 'boss1',
                password: 'somepassword!',
                firstName: 'Boss',
                lastName: 'User',
                role: 'boss',
                subordinates: ['regular1', 'regular2', 'regular3'],
            };

            const res = await request(app).post('/api/v1/users/register').send(bossRequestData);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.username).toBe('boss1');
            expect(res.body.data.firstName).toBe('Boss');
            expect(res.body.data.lastName).toBe('User');
            expect(res.body.data.role).toBe(bossRequestData.role.toUpperCase());
            expect(res.body.data).not.toHaveProperty('password');
            expect(res.body.data).toHaveProperty('subordinates');
            bossRequestData.subordinates.forEach((sub_username, index) => {
                expect(res.body.data.subordinates[index].username).toBe(sub_username);
            });
            expect(res.body.data).toHaveProperty('createdAt');
            expect(res.body.data).toHaveProperty('updatedAt');
        });
        it('should register a "regular" user and use "boss" input field to assign a boss', async () => {
            const regUserTestData1 = {
                username: 'regular4',
                password: 'somepassword!',
                role: 'regular',
                boss: 'boss1',
            };

            const res = await request(app).post('/api/v1/users/register').send(regUserTestData1);

            const getBossUser = await userMongoModel.findOne({ username: 'boss1' });
            expect(getBossUser).toBeTruthy();
            const getNewRegUser = await userMongoModel.findOne({ username: 'regular4' });
            expect(getNewRegUser).toBeTruthy();
            expect(getNewRegUser?.username).toBe('regular4');
            expect(getNewRegUser?.boss).toEqual(getBossUser?._id);
            expect(res.statusCode).toBe(200);
            expect(res.body.data.username).toBe('regular4');
        });
        it('should register a "boss" user and change the role of a "regular" user who is mentioned in the "boss" input field to "boss" (since that user now has subordinates)', async () => {
            const userTestData1 = {
                username: 'boss2',
                password: 'somepassword!',
                role: 'boss',
                boss: 'regular4',
                subordinates: ['regular3'],
            };

            const res = await request(app).post('/api/v1/users/register').send(userTestData1);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.username).toBe('boss2');

            userTestData1.subordinates.forEach((sub_username, index) => {
                expect(res.body.data.subordinates[index].username).toBe(sub_username);
            });
            const getBossUser = await userMongoModel.findOne({ username: 'boss2' });
            const getRegUser = await userMongoModel.findOne({ username: 'regular3' });
            const newCastedBossFromRegular = await userMongoModel.findOne({ username: 'regular4' });
            expect(getBossUser).toBeTruthy();
            expect(getRegUser).toBeTruthy();
            expect(getRegUser?.username).toBe('regular3');
            expect(getRegUser?.boss).toEqual(getBossUser?._id);
            expect(getBossUser?.subordinates).toContainEqual(getRegUser?._id);
            expect(newCastedBossFromRegular?.subordinates).toContainEqual(getBossUser?._id);
            expect(newCastedBossFromRegular?.role).toBe('BOSS');
        });
        it('should register new "boss" user and recursively return all subordinates of the users specified in the "subordinates" input field', async () => {
            const userTestData1 = {
                username: 'boss3',
                password: 'somepassword!',
                role: 'boss',
                subordinates: ['regular4'],
            };

            const res = await request(app).post('/api/v1/users/register').send(userTestData1);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.username).toBe('boss3');

            const getBossUser = await userMongoModel.findOne({ username: 'boss3' });
            const getSubUser = await userMongoModel.findOne({ username: 'regular4' });
            expect(getBossUser).toBeTruthy();
            expect(getSubUser).toBeTruthy();
            expect(getSubUser?.boss).toEqual(getBossUser?._id);
            expect(getBossUser?.subordinates).toContainEqual(getSubUser?._id);
            const populated_subs = res.body.data.subordinates.map((populated_sub: Partial<IUser>) => {
                return populated_sub._id;
            });
            getSubUser?.subordinates.forEach((sub_id) => {
                populated_subs.includes(sub_id);
            });
        });
        it('should login a regular, admin, and a boss users', async () => {
            const requestData1 = {
                username: 'regular3',
                password: 'somepassword!',
            };
            const requestData2 = {
                username: 'boss3',
                password: 'somepassword!',
            };
            const requestData3 = {
                username: 'admin1',
                password: 'somepassword!',
            };

            const res1 = await request(app).post('/api/v1/users/login').send(requestData1);
            const res1CookieSidStart = res1.get('Set-Cookie')[0].indexOf('sid');
            const res1CookieSidEnd = res1.get('Set-Cookie')[0].indexOf(';');
            // console.log('this is the full cookie', res1.get("Set-Cookie")[0])
            // console.log(res1.get("Set-Cookie")[0].substring(res1CookieSidStart, res1CookieSidEnd), 'this is the set cookie')
            process.env['regUserCookie'] = res1.get('Set-Cookie')[0].substring(res1CookieSidStart, res1CookieSidEnd);
            expect(res1.statusCode).toBe(200);
            expect(res1.body.message).toBe('You are now logged in!');

            const res2 = await request(app).post('/api/v1/users/login').send(requestData2);
            expect(res2.statusCode).toBe(200);
            expect(res2.body.message).toBe('You are now logged in!');
            const res2CookieSidStart = res2.get('Set-Cookie')[0].indexOf('sid');
            const res2CookieSidEnd = res2.get('Set-Cookie')[0].indexOf(';');
            process.env['bossUserCookie'] = res2.get('Set-Cookie')[0].substring(res2CookieSidStart, res2CookieSidEnd);

            const res3 = await request(app).post('/api/v1/users/login').send(requestData3);
            const res3CookieSidStart = res3.get('Set-Cookie')[0].indexOf('sid');
            const res3CookieSidEnd = res3.get('Set-Cookie')[0].indexOf(';');
            process.env['adminUserCookie'] = res3.get('Set-Cookie')[0].substring(res3CookieSidStart, res3CookieSidEnd);
            expect(res3.statusCode).toBe(200);
            expect(res3.body.message).toBe('You are now logged in!');
        });
    });

    describe('/change-boss', () => {
        it('"Boss3" should reassign the "regular4" sub from "boss3" to "boss1" and change the role of "boss3" to REGULAR since they would no longer have any users assigned to them', async () => {
            const reqObj = {
                // as "boss3"
                newboss: 'boss1', // new boss to assign the specified subs to
                subordinates: ['regular4'], // boss3' subs
            };

            const res = await request(app)
                .post('/api/v1/users/change-boss')
                .send(reqObj)
                .set('Cookie', [process.env['bossUserCookie']!]); // using the cookie retrieved from previous login tests

            expect(res.statusCode).toBe(200);

            const boss1 = await userMongoModel.findOne({ username: 'boss1' });
            const regular4 = await userMongoModel.findOne({ username: 'regular4' });
            const boss3 = await userMongoModel.findOne({ username: 'boss3' });
            expect(boss1).toBeTruthy();
            expect(boss1?.subordinates).toContain(regular4?._id);
            expect(regular4).toBeTruthy();
            expect(regular4?.boss).toEqual(boss1?._id);
            expect(boss3).toBeTruthy();
            expect(boss3?.role).toBe('REGULAR');
            expect(boss3?.subordinates).not.toContain(regular4?._id);
        });
        it('Admin should fail to assign "boss2" as a boss of "boss1" due to potential subordination chain loop', async () => {
            const reqObj = {
                // as "admin1"
                newboss: 'boss2', // new boss to assign the specified subs to
                subordinates: ['boss1'],
            };

            // should fail because: boss2 > boss1 > regular4 > boss2 – subordination loop

            const res = await request(app)
                .post('/api/v1/users/change-boss')
                .send(reqObj)
                .set('Cookie', [process.env['adminUserCookie']!]); // using the cookie retrieved from previous login tests

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe('failed');
            expect(res.body.reason).toBeTruthy();
        });
        it('Admin should be able to reassign the "regular3" sub from "boss2" to "boss3" and change the role of "boss3" to BOSS since they would now have at least one user assigned to them', async () => {
            const reqObj = {
                // as "admin1"
                newboss: 'boss3', // new boss to assign the specified subs to
                subordinates: ['regular3'], // boss2' subs
            };

            const res = await request(app)
                .post('/api/v1/users/change-boss')
                .send(reqObj)
                .set('Cookie', [process.env['adminUserCookie']!]); // using the cookie retrieved from previous login tests

            expect(res.statusCode).toBe(200);

            const boss2 = await userMongoModel.findOne({ username: 'boss2' });
            const regular3 = await userMongoModel.findOne({ username: 'regular3' });
            const boss3 = await userMongoModel.findOne({ username: 'boss3' });
            expect(boss2).toBeTruthy();
            expect(boss2?.subordinates).not.toContain(regular3?._id);
            expect(regular3).toBeTruthy();
            expect(regular3?.boss).toEqual(boss3?._id);
            expect(boss3).toBeTruthy();
            expect(boss3?.role).toBe('BOSS');
            expect(boss3?.subordinates).toContain(regular3?._id);
        });
    });

    describe('/get-users', () => {
        it('As boss1 should see self and all subordinates', async () => {
            const requestData = {
                username: 'boss1',
                password: 'somepassword!',
            };

            const res2 = await request(app).post('/api/v1/users/login').send(requestData);
            expect(res2.statusCode).toBe(200);
            expect(res2.body.message).toBe('You are now logged in!');
            const res2CookieSidStart = res2.get('Set-Cookie')[0].indexOf('sid');
            const res2CookieSidEnd = res2.get('Set-Cookie')[0].indexOf(';');
            process.env['bossUserCookie'] = res2.get('Set-Cookie')[0].substring(res2CookieSidStart, res2CookieSidEnd);

            const res = await request(app).get('/api/v1/users/get-users').set('Cookie', [process.env['bossUserCookie']!]);

            expect(res.statusCode).toBe(200);

            const boss1 = await userMongoModel.findOne({ username: 'boss1' });
            expect(boss1).toBeTruthy();
            const allSub = await boss1?.populateAllSubsIds();
            allSub?.forEach((sub_id, index) => {
                expect(res.body.data.subordinates[index]._id).toEqual(sub_id.toString().replace('"', ''));
                expect(res.body.data.subordinates[index]).not.toHaveProperty('password');
            });

            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.username).toBe('boss1');
            expect(res.body.data.role).toBe(boss1!.role);
            expect(res.body.data).not.toHaveProperty('password');
        });
        it('As regular user should only see self', async () => {
            const res = await request(app).get('/api/v1/users/get-users').set('Cookie', [process.env['regUserCookie']!]);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toHaveProperty('_id');
            expect(res.body.data.username).toBe('regular3');
            expect(res.body.data.role).toBe('REGULAR');
            expect(res.body.data).not.toHaveProperty('password');
            expect(res.body.data).not.toHaveProperty('subordinates');
            expect(res.body.data).not.toHaveProperty('boss');
        });
        it('Admin user should see all users', async () => {
            const allUsers = await userMongoModel.find({});

            const res = await request(app).get('/api/v1/users/get-users').set('Cookie', [process.env['adminUserCookie']!]);
            const admin = await userMongoModel.findOne({ username: 'admin1' });

            allUsers.forEach((sub, index) => {
                expect(res.body.data[index]._id).toEqual(sub._id.toString().replace('"', ''));
                expect(res.body.data[index]).not.toHaveProperty('password');
            });
            expect(allUsers).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({ _id: admin!._id, username: admin!.username, role: admin!.role }),
                ]),
            );
            expect(res.statusCode).toBe(200);
        });
    });
});
