import { spawn } from "node:child_process";

type Cmd = { name: string; cmd: string; args: string[] };

function run(cmd: Cmd): Promise<void> {
    return new Promise((resolve, reject) => {
        const p = spawn(cmd.cmd, cmd.args, {
            stdio: "inherit",
            shell: process.platform === "win32",
        });
        p.on("close", (code) => {
            if (code === 0) resolve();
            else reject(new Error(`[preflight] FAILED: ${cmd.name} (exit ${code})`));
        });
    });
}

async function main() {
    const cmds: Cmd[] = [
        { name: "type-check", cmd: "npm", args: ["run", "type-check"] },
        { name: "test", cmd: "npm", args: ["test"] },
        { name: "build", cmd: "npm", args: ["run", "build"] },
    ];

    if (process.env.PREFLIGHT_LINT === "1") {
        cmds.unshift({ name: "lint", cmd: "npm", args: ["run", "lint"] });
    }

    console.log("[preflight] START");
    for (const c of cmds) {
        console.log(`[preflight] RUN ${c.name}`);
        await run(c);
    }
    console.log("[preflight] ALL CHECKS PASSED");
}

main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
});
