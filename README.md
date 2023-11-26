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

![](./images/api1.png)

![](./images/api1.png)

### Authentication..

[Include a screenshot from the AWS console (Cognito User Pools) showing a confirmed user account.]

![](./images/pool.png)

### Independent learning (If relevant).

[ Briefly explain any aspects of your submission that required independent research and learning, i.e. not covered in the lectures/labs. State the files that have evidence of this.


State any other evidence of independent learning achieved while completing this assignment.

