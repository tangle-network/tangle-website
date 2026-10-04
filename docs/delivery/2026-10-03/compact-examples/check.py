import ast
import datetime
import json
from pathlib import Path

root = Path(__file__).parent
export = json.loads((root / 'exported-examples.json').read_text())
results = []
for example in export['quickstartExamples']:
    full = example['python']['fullCode']
    snippet = example['python']['snippet']
    snippet_tree = ast.parse(snippet)
    compile(snippet_tree, example['id'] + '-snippet.py', 'exec')
    tree = ast.parse(full)
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
    assert '"maxLifetimeSeconds": 900' in full
    if example['id'] in {'agent', 'parallel'}:
        assert 'base64' in imports
    if example['id'] == 'preview':
        assert 'input("Press Enter when finished viewing the preview.")' in full
        assert '"previewLink"' in full and 'link["status"] == "ready"' in full
    if example['id'] == 'parallel':
        assert 'ThreadPoolExecutor' in imports and 'max_workers=2' in full
        assert 'Sessions can share a workspace' in full
    if example['id'] in {'agent','parallel'}:
        assert 'import base64' in snippet
    if example['id'] == 'parallel':
        assert 'from concurrent.futures import ThreadPoolExecutor' in snippet
    if example['id'] == 'network':
        assert '"mode": "strict"' in snippet and '"includeImplicitDomains": False' in snippet
        assert '"mode": "strict"' in full and '"includeImplicitDomains": False' in full
    results.append({'id': example['id'], 'lines': len(full.splitlines()), 'syntax': 'pass', 'snippetSyntax': 'pass', 'snippetLines':len(snippet.splitlines()), 'imports': 'pass', 'cleanup': 'pass'})
receipt = {
    'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'sourceSha256': export['sourceSha256'], 'pythonVersion': __import__('sys').version,
    'examples': results, 'liveSandboxCalls': False,
    'limits': 'AST/compilation and maintained route source verification; snippets not executed against the hosted API.',
}
(root / 'python.json').write_text(json.dumps(receipt, indent=2) + '\n')
print(json.dumps(receipt, indent=2))
