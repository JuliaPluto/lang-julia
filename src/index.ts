import { NodeType, NodeProp } from "@lezer/common";
import { parser } from "@plutojl/lezer-julia";
import {
    LRLanguage,
    LanguageSupport,
    indentNodeProp,
} from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import * as autocomplete from "@codemirror/autocomplete";
import * as indent from "./indent";

type SyntaxConfig = {
    indents: { [nodeTypeName: string]: indent.GetIndent };
    keywords: NodeType[];
};

function getSyntaxConfig(): SyntaxConfig {
    let syntaxConfig: SyntaxConfig = {
        indents: {
            VariableDeclaration: indent.continuedIndent(),
            AssignmentExpression: indent.continuedIndent(),
        },
        keywords: [],
    };
    for (let node of parser.nodeSet.types) {
        // Collect keywords
        let groups = node.prop(NodeProp.group);
        let group = groups != null ? groups[0] : null;
        if (group === "keyword") {
            syntaxConfig.keywords.push(node);
        }

        // Configure indents
        let nodeIndent;
        let closedBy = node.prop(NodeProp.closedBy);
        if (closedBy) {
            nodeIndent = indent.delimitedIndent({ closing: closedBy });
        } else {
            nodeIndent = indent.noIndent;
        }
        syntaxConfig.indents[node.name] = nodeIndent;
    }

    return syntaxConfig;
}

let syntaxConfig = getSyntaxConfig();

console.log(
    `syntaxConfig.keywords.map((t) => t.name):`,
    syntaxConfig.keywords.map((t) => t.name)
);

let language = LRLanguage.define({
    parser: parser.configure({
        props: [
            indentNodeProp.add({
                ...syntaxConfig.indents,
                ModuleDefinition: indent.noIndent,
                BareModuleDefinition: indent.noIndent,
                VariableDeclaration: indent.continuedIndent(),
                AssignmentExpression: indent.continuedIndent(),
            }),
        ],
    }),
    languageData: {
        commentTokens: { line: "#" },
        indentOnInput: /^\s*(\]|\}|\)|end|else|elseif|catch|finally)$/,
        closeBrackets: { brackets: ["(", "[", "{", "'", '"', "`"] },
    },
});

export const keywordCompletion = language.data.of({
    autocomplete: autocomplete.completeFromList(
        syntaxConfig.keywords.map((keyword) => ({
            label: keyword.name,
            type: "keyword",
        }))
    ),
});

export type JuliaLanguageConfig = {
    /** Enable keyword completion */
    enableKeywordCompletion?: boolean;
};

let defaultConfig: JuliaLanguageConfig = {
    enableKeywordCompletion: false,
};

export function julia(config: JuliaLanguageConfig = defaultConfig) {
    config = { ...defaultConfig, ...config };
    let extensions: Extension[] = [];
    if (config.enableKeywordCompletion) {
        extensions.push(keywordCompletion);
    }
    return new LanguageSupport(language, extensions);
}
