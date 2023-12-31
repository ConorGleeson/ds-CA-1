import { Aws } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apig from "aws-cdk-lib/aws-apigateway";
import * as lambdanode from "aws-cdk-lib/aws-lambda-nodejs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as node from "aws-cdk-lib/aws-lambda-nodejs";
import * as custom from "aws-cdk-lib/custom-resources";
import { generateBatch } from "../shared/utils";
import { movies, reviews } from "../seedData/movies";
import * as iam from 'aws-cdk-lib/aws-iam';



type AppApiProps = {
  userPoolId: string;
  userPoolClientId: string;
};
export class AppApi extends Construct {
  constructor(scope: Construct, id: string, props: AppApiProps) {
    super(scope, id);
    // Tables 
    const moviesTable = new dynamodb.Table(this, "MoviesTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Movies",
    });

    const reviewsTable = new dynamodb.Table(this, "ReviewsTable", {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: "movieId", type: dynamodb.AttributeType.NUMBER },
      sortKey: { name: "username", type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: "Reviews",
    });




    const appCommonFnProps = {
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 128,
      runtime: lambda.Runtime.NODEJS_16_X,
      handler: "handler",
      environment: {
        USER_POOL_ID: props.userPoolId,
        CLIENT_ID: props.userPoolClientId,
        REGION: cdk.Aws.REGION,
      },
    };
    const authorizerFn = new node.NodejsFunction(this, "AuthorizerFn", {
      ...appCommonFnProps,
      entry: "./lambda/auth/authorizer.ts",
    });
    const requestAuthorizer = new apig.RequestAuthorizer(
      this,
      "RequestAuthorizer",
      {
        identitySources: [apig.IdentitySource.header("cookie")],
        handler: authorizerFn,
        resultsCacheTtl: cdk.Duration.minutes(0),
      }
    );
   

        // Reviews Functions
        const getAllReviewsFn = new lambdanode.NodejsFunction(this, "GetAllReviewsFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `./lambda/reviews/getReviewsbyMovieId.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: reviewsTable.tableName,
            REGION: "eu-west-1",
          },
        });

        const getReviewsByYearorNameFn = new lambdanode.NodejsFunction(this, "GetReviewsByYearOrNameFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `./lambda/reviews/getReviewsByYearorName.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: reviewsTable.tableName,
            REGION: "eu-west-1",
          },
        });

        const addReviewFn = new lambdanode.NodejsFunction(this, "addReviewFn",{
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `./lambda/reviews/addReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: reviewsTable.tableName,
            REGION: "eu-west-1",
          },
        })

        const updateReviewFn = new lambdanode.NodejsFunction(this, "updateReviewFn",{
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `./lambda/reviews/updateReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: reviewsTable.tableName,
            REGION: "eu-west-1",
          },
        })

        const getAllReviewsByReviewerFn = new lambdanode.NodejsFunction(this, "getAllReviewsByReviewerFn",{
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `./lambda/reviews/getAllReviewsByReviewer.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: reviewsTable.tableName,
            REGION: "eu-west-1",
          },
        })

        const translateReviewFn = new lambdanode.NodejsFunction(this, "translateReviewFn",{
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `./lambda/reviews/translateReview.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            REGION: "eu-west-1",
          },
        })


    // Seeding the table
    new custom.AwsCustomResource(this, "moviesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [moviesTable.tableName]: generateBatch(movies),
            [reviewsTable.tableName]: generateBatch(reviews),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), //.of(Date.now().toString()),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({  
        resources: [moviesTable.tableArn, reviewsTable.tableArn],
      }),
    });

      // Permissions


      reviewsTable.grantReadData(getAllReviewsFn)
      reviewsTable.grantReadData(getReviewsByYearorNameFn)
      reviewsTable.grantReadWriteData(addReviewFn)
      reviewsTable.grantReadWriteData(updateReviewFn)
      reviewsTable.grantReadData(getAllReviewsByReviewerFn)
      reviewsTable.grantReadWriteData(translateReviewFn)


      const appApi = new apig.RestApi(this, "AppApi", {
        description: "App RestApi",
        endpointTypes: [apig.EndpointType.REGIONAL],
        defaultCorsPreflightOptions: {
          allowOrigins: apig.Cors.ALL_ORIGINS,
        }
      });


      //iam policy statement examples https://snyk.io/advisor/npm-package/@aws-cdk/aws-iam/functions/@aws-cdk%2Faws-iam.PolicyStatement
      const translateStatment = new iam.PolicyStatement({
        actions: ["translate:TranslateText"],
        resources: ["*"], 
      });

      translateReviewFn.addToRolePolicy(translateStatment);

    // Public Routes


    const publicMovies = appApi.root.addResource("publicMovies");


    const publicMovie = publicMovies.addResource("{movieId}");

  

    

    const reviewsIdEndpoint =   publicMovie.addResource("reviews");
    reviewsIdEndpoint.addMethod("GET", new apig.LambdaIntegration(getAllReviewsFn, {proxy: true}));
    

    const reviewsEndpoint = publicMovies.addResource("reviews");

    reviewsEndpoint.addMethod("POST", new apig.LambdaIntegration(addReviewFn, {proxy: true}),
    {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    
    
    });

    const reviewsNameEndpoint = reviewsIdEndpoint.addResource("{type}");
    reviewsNameEndpoint.addMethod("GET", new apig.LambdaIntegration(getReviewsByYearorNameFn, {proxy: true}));
    reviewsNameEndpoint.addMethod("PUT", new apig.LambdaIntegration(updateReviewFn, {proxy: true}),
    {
      authorizer: requestAuthorizer,
      authorizationType: apig.AuthorizationType.CUSTOM,
    
    });


    const reviewerEndpoint = reviewsEndpoint.addResource("{username}");
    reviewerEndpoint.addMethod("GET", new apig.LambdaIntegration(getAllReviewsByReviewerFn, {proxy: true}));
    

    const translateEndpoint = reviewsNameEndpoint.addResource("translation");
    translateEndpoint.addMethod("GET", new apig.LambdaIntegration(translateReviewFn, {proxy: true}));

  }
}