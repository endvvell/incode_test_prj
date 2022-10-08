
–– To run the app:
(install) $ npm install
(compile) $ tsc
(run) $ docker-compose build && docker-compose up


–– To run the tests:
(Visual Studio seems to apply its own formatting when providing a source directory for the dockerfile. So I'd advise to cd into the "dockerfiles" folder and run these commands from there:)

$ docker build -t mongo_solo -f mongodb.dockerfile .

$ docker build -t redis_solo -f redis.dockerfile .

$ docker run --rm -d --name mongo_solo -p 27017:27017 mongo_solo

$ docker run --rm -d --name redis_solo -p 6379:6379 redis_solo

$ npm run test:watch

(I've decided to only implement integration tests.
They are far from covering all the possible edge-cases,
but they test the basic functionality well)




–– API Expected Input:

(Once the docker containers are up and running, the web-server will be listening on port 3000: http://localhost:3000/)

* POST /api/v1/users/register :
{
    "username":"<some_string>",
    "password":"<some_string>",
    "role":"ADMIN || REGULAR || BOSS",  (case-insensitive)
    "lastName":"<some_string>",         (optional)
    "firstName":"<some_string>",        (optional)
    "boss": "<some_username>",          (optional - if the specified boss exists and doesn't cause subordination loops with 
                                        the specified "subordinates" then this value is assigned as this new user's boss)
	"subordinates": ["<some_username>", "<some_username>", "<some_username>"],      (optional if user's role is "admin",
                                                                                    required if the user's role is "boss",
                                                                                    forbidden if user's role is "regular")
    
}


* POST /api/v1/users/login :
{
    "username":"<some_string>",
    "password":"<some_string>"
}


* POST /api/v1/users/logout:
{
    <nothing>
}


* POST /api/v1/users/change-boss :
{
    "newboss":"<some_username>",            (any user that wouldn't cause a subordination loop when assigned as a boss to the specified "subordinates")
    "subordinates": ["<some_username>", "<some_username>"]      (any user that is a subordinate of the logged-in user making a request)
}


* GET /api/v1/users/get-users : 
Returns a result appropriate to the role of the logged-in user making a request.







–– Some thoughts:

- Data is persisted to MongoDB.
- User sessions are stored in Redis, the frontend only receives a 'Secure' cookie (when in prod, otherwise, when running in dev, cookie is not sent over HTTPS and so can be read by any client, which is convenient for development).


I initially wanted to build this app following the Clean Architecture pattern, but then noticed the that the requirements paper mentioned to build a "tiny" app, so I decided to implement the architecture only partially:

The primary folders are ./src/core and ./src/infrastructure

./src/core – contains the code that can be thought of as independent of any frameworks - part of the core business logic - although I've decided to only implement the entities layer, so you can think of the "use cases" layer as being open, since the next layer up are controllers and frameworks molded together.

./src/infrastructure – contains all the app's logic and routing.
