## ServerlessREST Sddignment - Distributed Systems.

__Name:__ Conor Gleeson

This repository contains the implementation of a serverless REST API for the AWS platform. A CDK stack creates the infrastructure. The domain context of the API is movie reviews.

### API endpoints.

[ Provide a bullet-point list of the app's endpoints (excluding the Auth API endpoints).]
e.g.
 
+ POST /publicMovies/reviews - add a movie review.
+ GET /publicMovies/{movieId}/reviews - Get all the reviews for a movie with the specified id.
+ GET /publicMovies/{movieId}/reviews?minRating=n - Get all the reviews for the movie with the specified ID with a rating greater than the minRating.
+ GET /publicMovies/{movieId}/reviews/{reviewerName} - Get the review for the movie with the specified movie ID and written by the named reviewer.
+ PUT /publicMovies/{movieId}/reviews/{reviwerName} - Update the text of a review
+ GET /publicMovies/{movieId}/reviews/{year} - Get the review for the movie with the specified movie ID and written in a specified year.
+ GET /publicMovies/reviews/{reviewerName} - Get all the reviews written by a specific reviewer.
+ GET /movies/{movieId}/reviews/{reviewerName}/translation?language=code - Get a translated version of the review for the movie with the specified movie ID and written by the      named reviewer.

### Api Gateway

### API Screen
![](./images/api1.png)
This image shows the deployed API

### API Resources
![](./images/api2.png)
This image shows the API with the list of avalible resources

### /publicMovies/reviews
![](./images/api3.png)
This image shows the endpoint to add a review

### /publicMovies/reviews/{username}
![](./images/api4.png)
This image shows the endpoing to get all the reviews written by a specified user

### /publicMovies/{movieId}/reviews
![](./images/api5.png)
This image shows the endpoint to get all the reviews for a specified movie

### /publicMovies/{movieId}/reviews/{type}
![](./images/api6.png)
This image shows the endpoint to get the reviews for a specified movie by either a specified year or username

### /publicMovies/{movieId}/reviews/{type}
![](./images/api7.png)
This image shows the put endpoint to update a review

### /publicMovies/{movieId}/reviews/{type}/translation
![](./images/api8.png)
This image shows the endpoint to get a review for a movie written by a specified reviewer and then translate it to a chosen language


### Authentication..

##### UserPool
![](./images/auth1.png)
This image shows of a confirmed user in the cognito user pool


### Independent learning.

I used AWS tanslate to translate the reviews 

It is found in the file *ds-CA-1\lambda\reviews\translateReview.ts* 

This allows the text of a review to be translated from on language to another by specifying the language code in the endpoint url

Some online references were used to fully implment this:

+ https://snyk.io/advisor/npm-package/@aws-cdk/aws-iam/functions/@aws-cdk%2Faws-iam.PolicyStatement
+ https://www.youtube.com/watch?v=xdWpbr1DZHQ
+ https://stackoverflow.com/questions/65023384/translate-is-not-authorized-to-assume-role



