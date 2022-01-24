const spawn = require("child_process").spawn;

const BRACKET_END = "$(B_R-A_C-K_E-T)";

module.exports = (opt) => {
    return new Promise((resolve, reject) => {
        const child = spawn("sfLibraryManagerClient", [
            "--task=readTask",
            opt.libraryUIFolder ? "--libraryFolder=" + opt.libraryUIFolder : "",
            "--name=modules-manager"
        ]);
        var res = "";
        var _components = [];
        child
            .stdout
            .on("data", function(chunk) {
                res += chunk.toString('utf8');
                if (res.endsWith(BRACKET_END)) {
                    var splitted = res.split(BRACKET_END);
                    splitted = splitted[splitted.length - 2];
                    child.kill("SIGINT");
                    _components = JSON.parse(splitted);
                    //console.log("CompsLength: ", _components.length)
                    resolve(_components);
                }
            });
        child
            .stderr
            .on("data", e => {
                child.kill("SIGINT");
                reject(e);
            });
        child.on("error", reject);
    });
}
