const LogToConsole = require("./LogToConsole");
var exec = require('child_process').exec;

function ProjectChecker(logToConsole) {
    var log = new LogToConsole(logToConsole).log;

    /**
     * @callback check~callback
     * @param {string} err - Error message if the cli command has failed.
     * @param {object} cliErrReport - Raw json report from cli.
     * @param {number} errors - Number of errors detected in the project.
     * @param {number} warnings - Number of warnings.
     * @return undefined
     */

    /**
     * @param {string} projectRoot - Root path of the project to be checked
     * @param {check~callback} callback
     */
    this.check = function(projectRoot, callback) {
        // exec(`smartface --task=checkproject --projectRoot=${projectRoot}`,
        //     function(err, stdout, stderr) {
        //         if (err) {
        //             callback(err); // proc.execFile have failed
        //         }
        //         else if (stderr) {
        //             callback(stderr); // checkproject command have failed
        //         }
        //         else {
        //             var result = analyzeReport(stdout);
        //             if (result.errors != null && result.warnings != null) {
        //                 callback(null, stdout, result.errors, result.warnings);
        //             }
        //             else {
        //                 callback("An error occured!");
        //             }
        //         }
        //     });
        callback(null);
    };

    /**
     * Returns an object with the following properties:
     * - errors {number} - Number of errors detected in the project.
     * - warnings {number} - Number of warnings.
     * 
     * @param jsonString {string} - String that comes from "smartface 
     * --task=checkproject" cli command
     */
    function analyzeReport(jsonString) {

        var result = {
                errors: 0,
                warnings: 0
            },
            json;

        try {
            json = JSON.parse(jsonString);
        }
        catch (ex) {
            log("[ERROR]", ex);
            result.errors = result.warnings = null;
            return result;
        }

        // Missing folders or files (file errors)
        for (var info in json) {
            if (!json[info].exists) {
                ++result.errors;
            }
        }
        // Image errors
        for (var info in json) {
            if (json[info].exists && json[info].isImage && !json[info].isValid) {
                for (var ei = 0; ei < json[info].errors.length; ++ei) {
                    ++result.errors;
                }
            }
        }
        // Syntax checks
        for (var info in json) {
            if (json[info].warnings && !json[info].isJson && !json[info].isImage) {
                for (var wi = 0; wi < json[info].warnings.length; ++wi) {
                    ++result.warnings;
                }
            }
            if (json[info].errors && !json[info].isJson && !json[info].isImage) {
                for (var ei = 0; ei < json[info].errors.length; ++ei) {
                    ++result.errors;
                }
            }
        }
        // Json error checks
        for (var info in json) {
            if (json[info].isJson) {
                var projectJsonWarnings = json[info].warnings,
                    projectJsonErrors = json[info].errors;
                result.errors += projectJsonErrors.length;
                result.warnings += projectJsonWarnings.length;
                break;
            }
        }

        return result;
    }
}

module.exports = ProjectChecker;
