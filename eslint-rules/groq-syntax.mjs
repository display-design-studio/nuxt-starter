import { parse } from 'groq-js'

export const groqSyntax = {
  meta: {
    type: 'problem',
    docs: { description: 'Validate GROQ query syntax inside defineQuery()' },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'defineQuery') return
        const arg = node.arguments[0]
        if (!arg) return

        let query = null
        if (arg.type === 'Literal' && typeof arg.value === 'string') {
          query = arg.value
        }
        else if (arg.type === 'TemplateLiteral' && arg.quasis.length === 1) {
          query = arg.quasis[0].value.cooked
        }

        if (query === null) return

        try {
          parse(query)
        }
        catch (err) {
          context.report({
            node: arg,
            message: `GROQ syntax error: ${err instanceof Error ? err.message : String(err)}`,
          })
        }
      },
    }
  },
}
