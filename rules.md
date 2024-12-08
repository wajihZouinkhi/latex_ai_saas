<rules>
    <project_structure>
        <backend>
            <backend_type>Spring Boot</backend_type>
            <path>
                <folder_name>Backend_java_project</folder_name>
            </path>
            <rules_to_follow>
                <rule>
                    <description>
                        - Follow the Spring Boot best practices
                        - Make sure it is working well with Spring Boot
                        - Make sure to use the Spring Boot libraries
                        - All backend logic needs to be placed in the backend folder !important to follow this rule
                    </description>
                </rule>
                <rule>
                    <description>
                        - Before creating any new class file make sure you're not duplicating any existing class file like for example UserService.java is already present so don't create another UserService.java file or if the folder "service" exist don't create another folder called "services" while they are the same thing
                    </description>
                </rule>
                <rule>
                    <description>
                        - Before any file, folder, class or function creation always search in the codebase to see if already that logic idea exists or not it's really important to avoid repeating ourselves                    </description>
                </rule>
            </rules_to_follow>
        </backend>
        <frontend>
            <frontend_type>nextjs</frontend_type>
            <path>
                <folder_name>frontend</folder_name>
            </path>
            <rules_to_follow>
                <rule>
                    <description>
                        - Follow the NextJS best practices
                        - Always use tailwindcss for styling and shadcn/ui for components
                        - All frontend logic needs to be placed in the frontend folder !important to follow this rule
                        - Make sure to use the nextjs libraries
                        - Make sure to only use tailwindcss classes and not inline styles
                        - Make sure to use the shadcn/ui components and not the original react components
                    </description>
                </rule>
            </rules_to_follow>
        </frontend>
        <example_projects>
           **** <path_folder>examples</path_folder>
            <project_description>This folder contains some example projects that explains how to use a langgraph agent built with copilotkit sdk and langchain in python and how to use it in a nextjs project</project_description>
            <rules_to_follow>
                <rule>
                    <description>
                        - This folder `examples` is only for example projects and not for the main project
                        - You can't write , delete or modify any file in this folder you just use them as examples to understand how to use the copilotkit sdk and langchain in python and how to use it in a nextjs project
                    </description>
                </rule>
            </rules_to_follow>
        </example_projects>
        <agent_enhanced>
            <path_folder>agent_enhanced</path_folder>
            <strict_rules>
                <rule>
                    <description>
                        !IMPORTANT: This folder is STRICTLY for Python agent implementation only:
                        - Only Python code is allowed in this folder
                        - No frontend code should be placed here
                        - No backend (Spring Boot) code should be placed here
                        - This agent will be integrated with the existing Next.js frontend
                        - Communication with frontend will be through well-defined REST APIs
                    </description>
                </rule>
                <rule>
                    <description>
                        Integration Rules:
                        - Agent must expose REST endpoints for frontend communication
                        - All responses must follow agreed-upon JSON schemas
                        - Authentication tokens must be handled securely
                        - File operations must be coordinated with the Spring Boot backend
                        - State management must be independent of frontend state
                    </description>
                </rule>
                <rule>
                    <description>
                        Code Organization:
                        - All agent logic must be in Python
                        - Use type hints throughout the codebase
                        - Follow Python best practices and PEP standards
                        - Maintain clear separation between agent logic and API layer
                    </description>
                </rule>
            </strict_rules>
            <integration_points>
                <frontend>
                    <description>
                        The agent will be used by the Next.js frontend through:
                        - REST API calls
                        - WebSocket connections for real-time updates
                        - File upload/download endpoints
                        - State synchronization endpoints
                    </description>
                </frontend>
                <backend>
                    <description>
                        The agent will coordinate with Spring Boot backend for:
                        - File storage and retrieval
                        - User authentication
                        - Project metadata
                        - Persistent storage operations
                    </description>
                </backend>
            </integration_points>
            <project_description>
                This folder contains the enhanced agent implementation with advanced capabilities including:
                - Research and knowledge gathering
                - Learning and adaptation
                - Visualization generation
                - Code quality analysis
                - LaTeX document generation
            </project_description>
            <rules_to_follow>
                <rule>
                    <description>
                        - Follow Python best practices and type hints
                        - Use Poetry for dependency management
                        - Implement proper error handling and logging
                        - Write comprehensive unit tests
                    </description>
                </rule>
                <rule>
                    <description>
                        - Each node (Research, Learning, Visualization, Quality) should be in its own module
                        - Nodes should communicate through well-defined interfaces
                        - State management should be centralized
                        - Configuration should be externalized
                    </description>
                </rule>
                <rule>
                    <description>
                        - All API endpoints must be documented using OpenAPI/Swagger
                        - All functions must have docstrings
                        - Complex workflows should have sequence diagrams
                        - README must be kept up to date
                    </description>
                </rule>
                <rule>
                    <description>
                        - Integration with Spring Boot backend must use standard REST practices
                        - All endpoints must handle errors gracefully
                        - Authentication and authorization must be implemented
                        - Rate limiting should be considered
                    </description>
                </rule>
                <rule>
                    <description>
                        - LaTeX generation must follow best practices
                        - Generated documents must be well-structured
                        - Visual elements must be high quality
                        - Code snippets must be properly formatted
                    </description>
                </rule>
            </rules_to_follow>
            <folder_structure>
                <folder>
                    <name>src</name>
                    <subfolders>
                        <folder>
                            <name>nodes</name>
                            <description>Contains individual node implementations</description>
                            <files>
                                - research_node.py
                                - learning_node.py
                                - visualization_node.py
                                - quality_node.py
                                - planner_node.py
                            </files>
                        </folder>
                        <folder>
                            <name>core</name>
                            <description>Core functionality and shared utilities</description>
                            <files>
                                - state_manager.py
                                - config.py
                                - types.py
                                - utils.py
                            </files>
                        </folder>
                        <folder>
                            <name>api</name>
                            <description>API endpoints and integration</description>
                            <files>
                                - routes.py
                                - schemas.py
                                - middleware.py
                            </files>
                        </folder>
                        <folder>
                            <name>services</name>
                            <description>Business logic and services</description>
                            <files>
                                - latex_service.py
                                - github_service.py
                                - research_service.py
                                - visualization_service.py
                            </files>
                        </folder>
                    </subfolders>
                </folder>
                <folder>
                    <name>tests</name>
                    <description>Unit and integration tests</description>
                </folder>
                <folder>
                    <name>docs</name>
                    <description>Documentation and diagrams</description>
                </folder>
            </folder_structure>
        </agent_enhanced>
    </project_structure>
</rules>
