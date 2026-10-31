import { Sandbox } from "@tangle-network/sandbox";

const client = new Sandbox({
  apiKey: process.env.TANGLE_API_KEY!,
  baseUrl: "https://sandbox.tangle.tools",
});

// A fresh Linux machine, one command, then gone.
const box = await client.create();
try {
  const { exitCode, stdout } = await box.exec(
    "python3 -c 'import platform; print(platform.platform())'",
  );
  console.log(exitCode, stdout);
} finally {
  await box.delete();
}
