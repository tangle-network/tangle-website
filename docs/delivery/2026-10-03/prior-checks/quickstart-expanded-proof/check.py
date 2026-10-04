import ast
import datetime
import json
from pathlib import Path
import httpx

root = Path(__file__).parent
export = json.loads((root / 'exported-examples.json').read_text())
results = []
for example in export['quickstartExamples']:
    tree = ast.parse(example['python'])
    compile(tree, example['id'] + '.py', 'exec')
    scope = next(n for n in tree.body if isinstance(n, ast.With))
    assert ast.unparse(scope.items[0].context_expr.func) == 'httpx.Client'
    assert ast.unparse(scope.items[1].context_expr.func) == 'ExitStack'
    callback = next(n for n in scope.body if isinstance(n, ast.Expr) and isinstance(n.value, ast.Call) and ast.unparse(n.value.func) == 'cleanup.callback')
    assert ast.unparse(callback.value.args[0]) == 'lambda: tangle.delete(path).raise_for_status()'
    initial_poll = next(n for n in scope.body if isinstance(n, ast.For))
    assert scope.body.index(callback) < scope.body.index(initial_poll)
    assert not any(isinstance(n, (ast.Try, ast.TryStar)) for n in ast.walk(tree))
    imports = {alias.asname or alias.name for node in tree.body if isinstance(node, (ast.Import, ast.ImportFrom)) for alias in node.names}
    assert {'os', 'time', 'ExitStack', 'httpx'} <= imports
    assert '"maxLifetimeSeconds": 900' in example['python']
    if example['id'] in {'agent', 'parallel'}:
        assert 'base64' in imports
    if example['id'] == 'preview':
        assert 'input("Press Enter when finished viewing the preview.")' in example['python']
        assert '"previewLink"' in example['python'] and 'link["status"] == "ready"' in example['python']
    if example['id'] == 'parallel':
        assert 'ThreadPoolExecutor' in imports and 'max_workers=2' in example['python']
        assert 'Sessions can share a workspace' in example['python']
    if example['id'] == 'network':
        assert '"mode": "strict"' in example['python'] and '"includeImplicitDomains": False' in example['python']
    results.append({'id': example['id'], 'lines': len(example['python'].splitlines()), 'syntax': 'pass', 'imports': 'pass', 'cleanup': 'pass'})
receipt = {
    'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'sourceSha256': export['sourceSha256'], 'httpxVersion': httpx.__version__,
    'examples': results, 'liveSandboxCalls': False,
    'limits': 'AST/compilation and maintained route source verification; snippets not executed against the hosted API.',
}
(root / 'python.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
