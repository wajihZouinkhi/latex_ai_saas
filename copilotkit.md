<?xml version="1.0" encoding="UTF-8"?>
<copilotkit_docs>
    <hooks>
        <hook>
            <name>useCopilotAction</name>
            <description>Allows the copilot to take actions in the app by defining custom functions that can be called during chat.</description>
            <parameters>
                <parameter>
                    <name>name</name>
                    <type>string</type>
                    <required>true</required>
                    <description>The name of the action</description>
                </parameter>
                <parameter>
                    <name>description</name>
                    <type>string</type>
                    <required>false</required>
                    <description>Instructions for the copilot on how to use the action</description>
                </parameter>
                <parameter>
                    <name>parameters</name>
                    <type>Parameter[]</type>
                    <required>false</required>
                    <description>Array of parameters the action accepts</description>
                    <sub_parameters>
                        <param>name: string (required) - Parameter name</param>
                        <param>type: "string" | "number" | "boolean" | "object" | "object[]" | "string[]" | "number[]" | "boolean[]" (required)</param>
                        <param>description: string - Parameter description</param>
                        <param>required: boolean - Whether parameter is required</param>
                        <param>enum: string[] - Possible values for string parameters</param>
                    </sub_parameters>
                </parameter>
                <parameter>
                    <name>handler</name>
                    <type>(args) => Promise<any></type>
                    <required>true</required>
                    <description>Function that executes the action</description>
                </parameter>
            </parameters>
        </hook>

        <hook>
            <name>useCopilotReadable</name>
            <description>Provides knowledge and context to the copilot about application state.</description>
            <parameters>
                <parameter>
                    <name>description</name>
                    <type>string</type>
                    <required>true</required>
                    <description>Description of the information being provided</description>
                </parameter>
                <parameter>
                    <name>value</name>
                    <type>any</type>
                    <required>true</required>
                    <description>The actual value/state to be provided to copilot</description>
                </parameter>
                <parameter>
                    <name>parentId</name>
                    <type>string</type>
                    <required>false</required>
                    <description>ID of parent context for hierarchical structures</description>
                </parameter>
            </parameters>
        </hook>

        <hook>
            <name>useCopilotChat</name>
            <description>Direct interaction with Copilot instance for custom UI or programmatic control.</description>
            <returned_functions>
                <function>
                    <name>appendMessage</name>
                    <description>Add a new message to the chat</description>
                </function>
                <function>
                    <name>setMessages</name>
                    <description>Set all chat messages</description>
                </function>
                <function>
                    <name>deleteMessage</name>
                    <description>Remove a message from chat</description>
                </function>
                <function>
                    <name>reloadMessages</name>
                    <description>Reload messages from API</description>
                </function>
                <function>
                    <name>stopGeneration</name>
                    <description>Stop message generation</description>
                </function>
            </returned_functions>
        </hook>
    </hooks>

    <planned_actions>
        <action>
            <name>getFileContent</name>
            <description>Allow copilot to read project files</description>
            <parameters>
                <parameter>
                    <name>filePath</name>
                    <type>string</type>
                    <required>true</required>
                    <description>Path to the file to read</description>
                </parameter>
            </parameters>
        </action>

        <action>
            <name>createLatexFile</name>
            <description>Create and save LaTeX documents</description>
            <parameters>
                <parameter>
                    <name>content</name>
                    <type>string</type>
                    <required>true</required>
                    <description>LaTeX content to save</description>
                </parameter>
                <parameter>
                    <name>fileName</name>
                    <type>string</type>
                    <required>true</required>
                    <description>Name of the LaTeX file</description>
                </parameter>
                <parameter>
                    <name>projectId</name>
                    <type>string</type>
                    <required>true</required>
                    <description>ID of the project to associate the file with</description>
                </parameter>
            </parameters>
        </action>
    </planned_actions>
</copilotkit_docs> 