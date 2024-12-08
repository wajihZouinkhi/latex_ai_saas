<github_integration>
    <authentication>
        <jwt_token>
            <purpose>
                The JWT token is used to authenticate users across all API endpoints without requiring the frontend to pass user_id.
                - Token is generated upon successful login/registration
                - Contains encrypted user information (user_id, etc.)
                - Every API request must include this JWT token in the Authorization header
                - Backend extracts user_id from JWT token to identify the user making the request
                - This ensures secure and stateless authentication
            </purpose>
            <flow>
                1. User logs in/registers
                2. Backend generates JWT token containing user information
                3. Frontend stores token and includes it in all subsequent API requests
                4. Backend validates token and extracts user_id for each request
                5. No need to pass user_id explicitly from frontend
            </flow>
        </jwt_token>
    </authentication>

    <github_integration>
        <purpose>
            GitHub integration allows users to connect their GitHub accounts to access their repositories and their contents.
            The main goal is to store the GitHub access token to make authenticated GitHub API calls on behalf of the user.
        </purpose>
        <connection_flow>
            1. User initiates GitHub connection from frontend
            2. Backend redirects to GitHub OAuth flow
            3. GitHub redirects back with authorization code
            4. Backend exchanges code for access token
            5. Backend stores access token in user's database record
            6. Sets isGithubConnected to true in user's record
        </connection_flow>
        <database_storage>
            <user_fields>
                - githubAccessToken: string (encrypted)
                - isGithubConnected: boolean
                - githubUsername: string
            </user_fields>
        </database_storage>
        <api_endpoints>
            <repositories>
                <endpoint>/api/github/repositories</endpoint>
                <description>
                    - Extracts user_id from JWT token
                    - Retrieves user from database
                    - Checks if isGithubConnected is true
                    - Uses stored githubAccessToken to fetch repositories
                    - Returns list of user's repositories
                </description>
            </repositories>
            <repository_content>
                <endpoint>/api/github/repository/{owner}/{repo}/contents/{path}</endpoint>
                <description>
                    - Extracts user_id from JWT token
                    - Verifies GitHub connection
                    - Uses stored access token to fetch repository contents
                    - Can retrieve files, folders, and their contents
                    - Supports navigation through repository structure
                </description>
            </repository_content>
            <repository_branches>
                <endpoint>/api/github/repository/{owner}/{repo}/branches</endpoint>
                <description>
                    - Lists all branches in a repository
                    - Uses stored GitHub access token
                    - Provides branch information for repository management
                </description>
            </repository_branches>
        </api_endpoints>
        <security>
            <considerations>
                - GitHub access tokens are encrypted before storage
                - Tokens can be revoked by user
                - Regular token validation and refresh if needed
                - Secure handling of GitHub API responses
            </considerations>
        </security>
    </github_integration>

    <error_handling>
        <scenarios>
            - Token expired or invalid
            - GitHub API rate limits
            - Repository access permissions
            - Network connectivity issues
            - Invalid repository paths
        </scenarios>
        <responses>
            - Proper error status codes
            - Clear error messages
            - Token refresh flow if applicable
            - Graceful degradation
        </responses>
    </error_handling>
</github_integration> 