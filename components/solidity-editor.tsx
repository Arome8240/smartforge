"use client";

import { useEffect, useRef } from "react";
import Editor, { Monaco } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useTheme } from "next-themes";

interface SolidityEditorProps {
    value: string;
    onChange: (value: string) => void;
    height?: string;
    readOnly?: boolean;
    onCompilationErrors?: (errors: any[]) => void;
}

export function SolidityEditor({
    value,
    onChange,
    height = "600px",
    readOnly = false,
    onCompilationErrors,
}: SolidityEditorProps) {
    const { theme } = useTheme();
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    const handleEditorDidMount = (editor: monaco.editor.IStandaloneCodeEditor, monacoInstance: Monaco) => {
        editorRef.current = editor;

        // Register Solidity language if not already registered
        const languages = monacoInstance.languages.getLanguages();
        const solidityRegistered = languages.some((lang) => lang.id === "solidity");

        if (!solidityRegistered) {
            monacoInstance.languages.register({ id: "solidity" });

            // Solidity language configuration
            monacoInstance.languages.setLanguageConfiguration("solidity", {
                comments: {
                    lineComment: "//",
                    blockComment: ["/*", "*/"],
                },
                brackets: [
                    ["{", "}"],
                    ["[", "]"],
                    ["(", ")"],
                ],
                autoClosingPairs: [
                    { open: "{", close: "}" },
                    { open: "[", close: "]" },
                    { open: "(", close: ")" },
                    { open: '"', close: '"' },
                    { open: "'", close: "'" },
                ],
                surroundingPairs: [
                    { open: "{", close: "}" },
                    { open: "[", close: "]" },
                    { open: "(", close: ")" },
                    { open: '"', close: '"' },
                    { open: "'", close: "'" },
                ],
            });

            // Solidity syntax highlighting
            monacoInstance.languages.setMonarchTokensProvider("solidity", {
                keywords: [
                    "abstract",
                    "after",
                    "alias",
                    "anonymous",
                    "as",
                    "assembly",
                    "break",
                    "catch",
                    "constant",
                    "constructor",
                    "continue",
                    "contract",
                    "delete",
                    "do",
                    "else",
                    "emit",
                    "enum",
                    "error",
                    "event",
                    "external",
                    "fallback",
                    "final",
                    "for",
                    "function",
                    "if",
                    "immutable",
                    "import",
                    "in",
                    "indexed",
                    "interface",
                    "internal",
                    "is",
                    "library",
                    "mapping",
                    "memory",
                    "modifier",
                    "new",
                    "override",
                    "payable",
                    "pragma",
                    "private",
                    "public",
                    "pure",
                    "receive",
                    "return",
                    "returns",
                    "revert",
                    "storage",
                    "struct",
                    "switch",
                    "this",
                    "throw",
                    "try",
                    "type",
                    "unchecked",
                    "using",
                    "view",
                    "virtual",
                    "while",
                ],
                typeKeywords: [
                    "address",
                    "bool",
                    "string",
                    "var",
                    "int",
                    "uint",
                    "bytes",
                    "byte",
                    "int8",
                    "int16",
                    "int24",
                    "int32",
                    "int40",
                    "int48",
                    "int56",
                    "int64",
                    "int72",
                    "int80",
                    "int88",
                    "int96",
                    "int104",
                    "int112",
                    "int120",
                    "int128",
                    "int136",
                    "int144",
                    "int152",
                    "int160",
                    "int168",
                    "int176",
                    "int184",
                    "int192",
                    "int200",
                    "int208",
                    "int216",
                    "int224",
                    "int232",
                    "int240",
                    "int248",
                    "int256",
                    "uint8",
                    "uint16",
                    "uint24",
                    "uint32",
                    "uint40",
                    "uint48",
                    "uint56",
                    "uint64",
                    "uint72",
                    "uint80",
                    "uint88",
                    "uint96",
                    "uint104",
                    "uint112",
                    "uint120",
                    "uint128",
                    "uint136",
                    "uint144",
                    "uint152",
                    "uint160",
                    "uint168",
                    "uint176",
                    "uint184",
                    "uint192",
                    "uint200",
                    "uint208",
                    "uint216",
                    "uint224",
                    "uint232",
                    "uint240",
                    "uint248",
                    "uint256",
                    "bytes1",
                    "bytes2",
                    "bytes3",
                    "bytes4",
                    "bytes5",
                    "bytes6",
                    "bytes7",
                    "bytes8",
                    "bytes9",
                    "bytes10",
                    "bytes11",
                    "bytes12",
                    "bytes13",
                    "bytes14",
                    "bytes15",
                    "bytes16",
                    "bytes17",
                    "bytes18",
                    "bytes19",
                    "bytes20",
                    "bytes21",
                    "bytes22",
                    "bytes23",
                    "bytes24",
                    "bytes25",
                    "bytes26",
                    "bytes27",
                    "bytes28",
                    "bytes29",
                    "bytes30",
                    "bytes31",
                    "bytes32",
                ],
                operators: [
                    "=",
                    ">",
                    "<",
                    "!",
                    "~",
                    "?",
                    ":",
                    "==",
                    "<=",
                    ">=",
                    "!=",
                    "&&",
                    "||",
                    "++",
                    "--",
                    "+",
                    "-",
                    "*",
                    "/",
                    "&",
                    "|",
                    "^",
                    "%",
                    "<<",
                    ">>",
                    ">>>",
                    "+=",
                    "-=",
                    "*=",
                    "/=",
                    "&=",
                    "|=",
                    "^=",
                    "%=",
                    "<<=",
                    ">>=",
                    ">>>=",
                    "=>",
                ],
                symbols: /[=><!~?:&|+\-*\/\^%]+/,
                tokenizer: {
                    root: [
                        [
                            /[a-z_$][\w$]*/,
                            {
                                cases: {
                                    "@typeKeywords": "keyword.type",
                                    "@keywords": "keyword",
                                    "@default": "identifier",
                                },
                            },
                        ],
                        [/[A-Z][\w\$]*/, "type.identifier"],
                        { include: "@whitespace" },
                        [/[{}()\[\]]/, "@brackets"],
                        [/[<>](?!@symbols)/, "@brackets"],
                        [
                            /@symbols/,
                            {
                                cases: {
                                    "@operators": "operator",
                                    "@default": "",
                                },
                            },
                        ],
                        [/\d*\.\d+([eE][\-+]?\d+)?/, "number.float"],
                        [/0[xX][0-9a-fA-F]+/, "number.hex"],
                        [/\d+/, "number"],
                        [/[;,.]/, "delimiter"],
                        [/"([^"\\]|\\.)*$/, "string.invalid"],
                        [/"/, { token: "string.quote", bracket: "@open", next: "@string" }],
                        [/'([^'\\]|\\.)*$/, "string.invalid"],
                        [/'/, { token: "string.quote", bracket: "@open", next: "@string_single" }],
                    ],
                    string: [
                        [/[^\\"]+/, "string"],
                        [/\\./, "string.escape.invalid"],
                        [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
                    ],
                    string_single: [
                        [/[^\\']+/, "string"],
                        [/\\./, "string.escape.invalid"],
                        [/'/, { token: "string.quote", bracket: "@close", next: "@pop" }],
                    ],
                    whitespace: [
                        [/[ \t\r\n]+/, "white"],
                        [/\/\*/, "comment", "@comment"],
                        [/\/\/.*$/, "comment"],
                    ],
                    comment: [
                        [/[^\/*]+/, "comment"],
                        [/\/\*/, "comment", "@push"],
                        [/\*\//, "comment", "@pop"],
                        [/[\/*]/, "comment"],
                    ],
                },
            });

            // Add autocomplete for Solidity
            monacoInstance.languages.registerCompletionItemProvider("solidity", {
                provideCompletionItems: (model, position) => {
                    const word = model.getWordUntilPosition(position);
                    const range: monaco.IRange = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    };

                    const suggestions: monaco.languages.CompletionItem[] = [
                        ...["pragma", "contract", "function", "modifier", "event", "struct", "enum", "mapping"].map(
                            (keyword) => ({
                                label: keyword,
                                kind: monacoInstance.languages.CompletionItemKind.Keyword,
                                insertText: keyword,
                                range,
                            })
                        ),
                        ...["address", "uint256", "string", "bool", "bytes32"].map((type) => ({
                            label: type,
                            kind: monacoInstance.languages.CompletionItemKind.TypeParameter,
                            insertText: type,
                            range,
                        })),
                    ];

                    return { suggestions };
                },
            });
        }

        // Format on paste
        editor.onDidPaste(() => {
            editor.getAction("editor.action.formatDocument")?.run();
        });
    };

    const handleEditorChange = (value: string | undefined) => {
        const code = value || "";

        // Enforce a single constructor definition
        if (onCompilationErrors) {
            const constructorMatches = code.match(/\bconstructor\s*\(/g) || [];
            if (constructorMatches.length > 1) {
                onCompilationErrors([{ message: "Only one constructor is allowed in a contract." }]);
            } else {
                onCompilationErrors([]);
            }
        }

        onChange(code);
    };

    useEffect(() => {
        if (typeof window !== "undefined") {
            monaco.editor.setTheme("vs-dark");
        }
    }, []);

    return (
        <div className="border border-border rounded-lg overflow-hidden">
            <Editor
                height={height}
                defaultLanguage="solidity"
                language="solidity"
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                theme={theme === "dark" ? "vs-dark" : "light"}
                options={{
                    minimap: { enabled: true },
                    fontSize: 14,
                    fontFamily: "'Fira Code', 'Courier New', monospace",
                    lineNumbers: "on",
                    rulers: [80, 120],
                    wordWrap: "on",
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    readOnly,
                    formatOnPaste: true,
                    formatOnType: true,
                    tabSize: 4,
                    insertSpaces: true,
                    bracketPairColorization: {
                        enabled: true,
                    },
                    suggest: {
                        snippetsPreventQuickSuggestions: false,
                    },
                    quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: false,
                    },
                }}
            />
        </div>
    );
}
