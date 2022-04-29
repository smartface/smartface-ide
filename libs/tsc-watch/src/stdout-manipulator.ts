const stripAnsi = require('strip-ansi');
import * as chalk  from "chalk";


const typescriptErrorRegex = /\((\d+),(\d+)\): error TS(\d+): /;
const compilationStartedRegex = /( Starting compilation in watch mode\.\.\.| File change detected\. Starting incremental compilation\.\.\.)/;


let num = 0;


const manipulateColorsHelper = (rawLine: string) => {
    let line = rawLine;
    typescriptErrorRegex.lastIndex = 0;
    if(typescriptErrorRegex.test(line)){
        line = stripAnsi(rawLine);
        const regRes = typescriptErrorRegex.exec(line);
        const parts = line.split(regRes[0]);
        typescriptErrorRegex.lastIndex = 0;
        ++num;
        line = `\r${chalk.red(num + '. 🔥')} ${chalk.cyan(parts.shift())}${chalk.gray(':')}${chalk.yellow(regRes[1])}${
            chalk.gray(':')}${chalk.yellow(regRes[2])} - ${chalk.red('error')} ${
                chalk.gray('TS' + regRes[3]+':')} ${parts.join('')}`
    }else if(compilationStartedRegex.test(rawLine)){
        num = 0;
    }
    return line;
}

export const manipulateColors = (rawLine: string) => {
    return rawLine.split('\n').map(r => manipulateColorsHelper(r)).join('\n');
}