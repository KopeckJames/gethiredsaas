# Project Context

This document provides an overview of the functions and their relationships within the project. It serves as a reference for understanding the project's functionality.

## lib/auth.ts

- **`createServerSupabaseClient`**: Responsible for creating a Supabase client instance for server-side operations.
- **`get`**: Retrieves a value, possibly from cookies or session storage.
- **`set`**: Sets a value, possibly in cookies or session storage, with options.
- **`remove`**: Removes a value, possibly from cookies or session storage, with options.
- **`getUser`**: Retrieves the current user's information.
- **`getUserId`**: Retrieves the current user's ID.

## lib/subscription.ts

- **`checkSubscription`**: Checks if a user has a subscription. Currently bypassed to always return true.
- **`getUserSubscription`**: Retrieves the user's subscription status. Currently set to always return as "pro".

## lib/utils.ts

- **`cn`**: A utility function, possibly for class name manipulation.
- **`absoluteUrl`**: Constructs an absolute URL from a given path.

## lib/api-limit.ts

- **`incrementApiLimit`**: Increments the API usage count for the current user.
- **`checkApiLimit`**: Checks if the current user is within their free API usage limit.
- **`getApiLimitCount`**: Retrieves the current API usage count for the user.

## app/api/interview/route.ts

- **`POST`**: Handles POST requests for the `/api/interview` route. It uses the Replicate API to run a model with a given prompt, checks user authentication, API limits, and subscription status.

## Relationships

- The `auth.ts` functions are used for user authentication and session management.
- The `subscription.ts` functions manage user subscription status, though currently bypassed.
- The `api-limit.ts` functions manage API usage limits for users.
- The `route.ts` file in the `app/api/interview` directory uses these utility functions to handle API requests, ensuring users are authenticated and within their usage limits.

This document will be referenced at the start of each new task to provide context and understanding of the project's structure and functionality.
