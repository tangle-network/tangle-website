# Typed into a terminal by `scripts/record-examples.mts --session pair`; the home page replays the record.
tangle sandbox create --name particles --backend claude-code --backend-model zai/glm-5.3
tangle agent prompt particles "Build a page in ~/app: a few thousand glowing particles swirl in and settle into the words 'Hello, world' on a dark canvas, then scatter from the pointer. Plain index.html, style.css and app.js, kept short. A package.json start script serves the folder with a small Node server on PORT (default 3000). Don't start it; I'll put it online." --timeout 900000 --stream
tangle preview start particles --cwd app
