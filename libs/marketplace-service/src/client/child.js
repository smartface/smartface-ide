const spawn = require("child_process").spawn;

const BRACKET_END = "$(B_R-A_C-K_E-T)";

module.exports = (taskData) => {
    return new Promise((resolve, reject) => {
        const child = spawn("sfMarketplaceServiceClient", [
        ]);
        var res = "";
        child.stdin.write(JSON.stringify(taskData));
        child.stdin.write(BRACKET_END);
        child
            .stdout
            .on("data", function(chunk) {
                res += chunk.toString('utf8');
                if (res.endsWith(BRACKET_END)) {
                    var splitted = res.split(BRACKET_END);
                    splitted = splitted[splitted.length - 2];
                    child.kill("SIGINT");
                    //console.log("CompsLength: ", _components.length)
                    resolve( JSON.parse(splitted));
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
