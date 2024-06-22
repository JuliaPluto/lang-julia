import { NodeType, NodeProp } from "@lezer/common";
import { parser } from "@plutojl/lezer-julia";
import {
    LRLanguage,
    LanguageSupport,
    indentNodeProp,
} from "@codemirror/language";
import { tags as t, styleTags } from "@lezer/highlight";
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

let juliaStyleTags = styleTags({
    String: t.string,
    TripleString: t.string,
    CommandString: t.string,
    StringWithoutInterpolation: t.string,
    TripleStringWithoutInterpolation: t.string,
    CommandStringWithoutInterpolation: t.string,

    "String/$ TripleString/$ CommandString/$": t.special(t.brace),
    "String/( TripleString/( CommandString/(": t.special(t.brace),
    "String/) TripleString/) CommandString/)": t.special(t.brace),

    Comment: t.lineComment,
    BlockComment: t.comment,

    "mutable struct StructDefinition/end": t.definitionKeyword,
    "primitive type PrimitiveDefinition/end": t.definitionKeyword,
    "const local global": t.definitionKeyword,
    // "module ModuleDefinition/end import using export": t.moduleKeyword,

    "ForStatement/for ForBinding/in ForStatement/end": t.controlKeyword,
    "WhileStatement/while WhileStatement/end": t.controlKeyword,
    "IfClause/if IfClause/elseif ElseClause/else IfStatement/end":
        t.controlKeyword,
    "default break return": t.controlKeyword,
    "TryStatement/try CatchClause/catch TryElseClause/else FinallyClause/finally TryStatement/end":
        t.controlKeyword,

    "( )": t.paren,
    "[ ]": t.paren,
    "{ }": t.paren,
    [syntaxConfig.keywords.map((t) => t.name).join(" ")]: t.keyword,

    BooleanLiteral: t.bool,
    Number: t.number,
    "Coefficient/PrefixedString!": t.unit,

    // Look at us being rascals
    "Type! TypeParameters!": t.typeName,
    // "StructDefinition/Definition! PrimitiveDefinition/Definition! AbstractDefinition/Definition!":
    //   t.definition(t.typeName),
    "StructDefinition/Identifier StructDefinition/AssignmentExpression/Identifier StructDefinition/TypedExpression/Identifier StructDefinition/AssignmentExpression/TypedExpression/Identifier":
        t.definition(t.propertyName),

    ":: <:": t.typeOperator,

    Identifier: t.variableName,

    "MacroIdentifier! MacroFieldExpression!": t.macroName,
    "MacroDefinition/Definition!": t.definition(t.macroName),

    "FieldName!": t.propertyName,
    FieldExpression: t.propertyName,
    "FieldExpression .": t.derefOperator,
    "Symbol!": t.atom,
});

let language = LRLanguage.define({
    parser: parser.configure({
        props: [
            juliaStyleTags,
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
