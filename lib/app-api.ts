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
import { movies } from "../seedData/movies";
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
    // Movies Functions
    const getAllMoviesFn = new lambdanode.NodejsFunction(
      this,
      "GetAllMoviesFn",
      {
        ...appCommonFnProps,
        architecture: lambda.Architecture.ARM_64,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: `./lambda/movies/getAllMovies.ts`,
        timeout: cdk.Duration.seconds(10),
        memorySize: 128,
        environment: {
          TABLE_NAME: moviesTable.tableName,
          REGION: 'eu-west-1',
        },
      }
      );

      const getMovieByIdFn = new lambdanode.NodejsFunction(
        this,
        "GetMovieByIdFn",
        {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `./lambda/movies/getMovieById.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: 'eu-west-1',
          },
        }
        );
        const newMovieFn = new lambdanode.NodejsFunction(this, "AddMovieFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `./lambda/movies/addMovie.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: "eu-west-1",
          },
        });

        const removeMovieFn = new lambdanode.NodejsFunction(this, "RemoveMovieFn", {
          architecture: lambda.Architecture.ARM_64,
          runtime: lambda.Runtime.NODEJS_16_X,
          entry: `./lambda/movies/deleteMovie.ts`,
          timeout: cdk.Duration.seconds(10),
          memorySize: 128,
          environment: {
            TABLE_NAME: moviesTable.tableName,
            REGION: "eu-west-1",
          },
        });

    // Seeding the table
    new custom.AwsCustomResource(this, "moviesddbInitData", {
      onCreate: {
        service: "DynamoDB",
        action: "batchWriteItem",
        parameters: {
          RequestItems: {
            [moviesTable.tableName]: generateBatch(movies),
          },
        },
        physicalResourceId: custom.PhysicalResourceId.of("moviesddbInitData"), //.of(Date.now().toString()),
      },
      policy: custom.AwsCustomResourcePolicy.fromSdkCalls({
        resources: [moviesTable.tableArn],  
      }),
    });

      // Permissions
      moviesTable.grantReadData(getAllMoviesFn);
      moviesTable.grantReadData(getMovieByIdFn)
      moviesTable.grantReadWriteData(newMovieFn)
      moviesTable.grantReadWriteData(removeMovieFn)


      const appApi = new apig.RestApi(this, "AppApi", {
        description: "App RestApi",
        endpointTypes: [apig.EndpointType.REGIONAL],
        defaultCorsPreflightOptions: {
          allowOrigins: apig.Cors.ALL_ORIGINS,
        }
      });

    // Public Routes


    const publicMovies = appApi.root.addResource("publicMovies");

    publicMovies.addMethod("GET", new apig.LambdaIntegration(getAllMoviesFn, {proxy: true}));

    publicMovies.addMethod("POST", new apig.LambdaIntegration(newMovieFn, {proxy: true}));

    const publicMovie = publicMovies.addResource("{movieId}");

    publicMovie.addMethod("GET", new apig.LambdaIntegration(getMovieByIdFn, {proxy: true}));

    publicMovie.addMethod("DELETE", new apig.LambdaIntegration(removeMovieFn, {proxy: true}));



    // Private Routes

    const privateMovies = appApi.root.addResource("privateMovies");

    privateMovies.addMethod(
      "GET",
      new apig.LambdaIntegration(getAllMoviesFn, {proxy: true}),
      {
        authorizer: requestAuthorizer,
        authorizationType: apig.AuthorizationType.CUSTOM,
      }
    );
  }
}