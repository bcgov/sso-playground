## SSO Playground

OIDC and SAML playground is a next.js application built by Pathfinder SSO Team.

## Features

- **Multiple configurations**: The playground offers flexibility in testing. You can choose from pre-configured OIDC providers like Keycloak, Auth0 or Google Accounts, or you can even enter your own OIDC URLs to test against a custom provider.

- **Hands-on experimentation**: By allowing users to interact with the OIDC flow manually, the playground provides a practical learning experience. Developers can experiment with different parameters and scopes to see how they affect the authorization process and the claims returned.

- **Improved debugging**: Since you can isolate and test each step individually, the playground can simplify debugging OIDC integration issues within your application.

## Usage

### OpenID Connect

- Access the URL(http://localhost:3000 if running locally) in a browser and select a flow type that's relevant to your client.
- After selecting the flow type, a form is displayed asking for parameters to run the authentication process.
- The `Discovery URL` is a JSON document that contains important configuration details for the OpenID Connect provider. This document includes information such as:
  - authorization endpoint URL
  - token endpoint URL (optional for implicit flow)
  - userinfo endpoint URL (optional)
  - JSON Web Key Set (JWKS) document URL
  - issuer identifier, and other relevant settings
- After you enter the `Discovery URL`, it should auto populate other URLs if they exist in the JSON document.
- Enter rest of the fields and click on `Login` button to run the authentication process. If the login was successful, the application should display a panel on the right of the form with a drop-down listing retrieved tokens.

### SAML

- Navigate to `https://dev.loginproxy.gov.bc.ca/auth/realms/standard/protocol/saml/descriptor`
- Copy `SingleSignOnService`, `SingleLogoutService`, `X509Certificate` for completing the login form
- Use your client ID as the `Entity ID`
- Click login button

#### Troubleshooting

- You may see `Logout Failed` error when attempting to logout
- The logout functionality does not work due to limitation of access in updating `Logout Service POST Binding URL` under `Fine Grain SAML Endpoint Configuration` settings of the client
- Login to keycloak and manually update the setting with value `http://localhost:3000/logout/callback`. **Note: Update the host and port if different**

## Requirements

- A browser
- node v22
- yarn v1.22
- asdf (optional)

## Installation

- Create a `.env` file at the root of the project and add below values
  ```
  NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
  ```
- `yarn` installs all the dependencies
- `yarn dev` runs the application in development environment
- `yarn build` generated a production build
- `yarn start` runs the application in production environment

## License

Code released under the [Apache License, Version 2.0](./LICENSE).
