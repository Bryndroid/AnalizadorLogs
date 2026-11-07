

const fs = require('node:fs/promises');
const path = require('node:path');
const readline = require('node:readline/promises');

class CheckLogsEngine{
    // VARIABLES PARA VALIDACIONES.
    #VALID_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
    #MAX_CHARACTERS = 250;
    #MIN_CHARACTERS = 10;
    #VALID_FORMAT = 'txt'; //Unicamente vamos a leer txt.

    // STORAGE DE SEVERITYS
    #SEVERITY_TYPES_LOGS = [{
        full: "INFO",
        redu: "INF",
        color: "#1713eb",
        count:0
    }, {
        full: "WARNING",
        redu: "WARN",
        color: "#ebe713",
        count: 0
    }, {
        full: "ERROR",
        redu: "ERR",
        color: "#eb0909",
        count: 0
    }];

    // STORAGE DE ERRORES
    #INVALID_COUNT = 0;
    #INVALID_LINE = []; //Aqui pondras que en que linea esta el error y el message. Tendra esta estructura {line:0,message:"default", case:''}. En case unicamente puede ser ADVERTENCIA o ERROR. 

    #fileUrl;
    #severityAliases = new Map([
        ["INFO", "INFO"],
        ["INF", "INFO"],
        ["WARNING", "WARNING"],
        ["WARN", "WARNING"],
        ["ERROR", "ERROR"],
        ["ERR", "ERROR"]
    ]); //Para las formas en como puede venir 

    constructor(url = '') {
        this.#fileUrl = url;       
    }
    //Funcion principal
    async initChecking(){
        const initUrl = this.#fileUrl ? path.resolve(this.#fileUrl) : path.join(__dirname, "ArchivosPrueba");
        const stats = await fs.stat(initUrl);
        // Si se trata de un archivo directo del usuario:
        if (stats.isFile()) {
            if (path.extname(initUrl).toLowerCase() !== `.${this.#VALID_FORMAT}`) {
                throw new Error(`El archivo "${initUrl}" no es un archivo .${this.#VALID_FORMAT}.`);
            }

            await this.#analyzeFile(initUrl);
            return;
        }
        // Si se trata de otra cosa ...
        if (!stats.isDirectory()) {
            throw new Error(`La ruta "${initUrl}" no es un archivo ni un directorio.`);
        }
        // Extraigo los archivos, veo su formato y los ordeno.
        const files = (await fs.readdir(initUrl, { withFileTypes: true }))
            .filter(entry => entry.isFile() && path.extname(entry.name).toLowerCase() === `.${this.#VALID_FORMAT}`)
            .map(entry => path.join(initUrl, entry.name))
            .sort((first, second) => first.localeCompare(second));

        if (files.length === 0) {
            console.log(`No se encontraron archivos .${this.#VALID_FORMAT} en "${initUrl}".`);
            return;
        }
        //Ya ordenados comparo cada uno
        for (let index = 0; index < files.length; index += 1) {
            await this.#analyzeFile(files[index]);
            // Cuando termino, pregunto si puedo seguir analizando.
            if (index < files.length - 1 && !(await this.#askToContinue())) {
                break;
            }
        }
    }

    async #analyzeFile(filePath) {
        //Importante setear todo en su estado default.
        this.#INVALID_COUNT = 0;
        this.#INVALID_LINE = [];
        this.#SEVERITY_TYPES_LOGS.forEach(severity => {
            severity.count = 0;
        });

        const content = await fs.readFile(filePath, "utf8");
        const lines = content.split(/\r\n|\n|\r/);
        if (content.endsWith("\n") || content.endsWith("\r")) {
            lines.pop();
        }

        lines.forEach((line, index) => {
            this.#checkFormat(line, index + 1);
        });

        console.log(`\nArchivo analizado: ${path.basename(filePath)}`);
        this.#logSeverity(lines.length);
    }

    async #askToContinue() {
        const interfaceReadline = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        try {
            const answer = await interfaceReadline.question(
                "\n¿Deseas analizar el siguiente archivo? (s/n): "
            );
            return answer.trim().toLowerCase() === "s";
        } finally {
            interfaceReadline.close();
        }
    }
    //Funciones auxiliares. 
    //Funcion para guardar en base a que severity es. Unicamente lleva el contador de los serveritys y los aumenta si tienen el formato correcto.
    #storageSeverity(severityName){
        const severity = this.#SEVERITY_TYPES_LOGS.find(item => item.full === severityName);
        if (severity) {
            severity.count += 1;
        }
    }
    //Funcion para guardar y llevar el conteo de las lineas invalidas. Unicamente para guardar
    #storageError(line, message, caseType = "ERROR", content = ""){
        this.#INVALID_COUNT += 1;
        this.#INVALID_LINE.push({ line, message, case: caseType, content });
    }
    //Funcion para analizar el formato 
    //Aqui adentro tambien ira la deteccion de la fecha, si esta mal formateada. Aqui contendra todas las instrucciones que te he mencionado.
    #checkFormat(line, lineNumber){

        //CASE 1: LINEA VACIA -> ADVERTENCIA
        const trimmedLine = line.trim();
        if (trimmedLine.length === 0) {
            this.#storageError(lineNumber, "La línea está vacía.", "ADVERTENCIA", line);
            return;
        }

        //CASE 2: LINEA SIN SEVERITY. Basada en el corchete y si adentro del corchete hay algo.
        const bracketedSeverity = trimmedLine.match(/^\[([^\]]+)\]/);
        const leadingSeverity = bracketedSeverity
            ? bracketedSeverity[1]
            : trimmedLine.match(/^([A-Za-z]+)\b/)?.[1];

        if (!leadingSeverity) {
            this.#storageError(
                lineNumber,
                "No se encontró un severity válido al inicio de la línea.",
                "ERROR",
                line
            );
            return;
        }
        //CASE 3: Si existe un Severity no parametrizado.
        const normalizedSeverity = this.#severityAliases.get(leadingSeverity.toUpperCase());
        if (!normalizedSeverity) {
            this.#storageError(lineNumber, `Severity incorrecto: "${leadingSeverity}".`, "ERROR", line);
            return;
        }
        //CASE 4: Si el severity no tiene un formato correcto.
        if (leadingSeverity !== leadingSeverity.toUpperCase()) {
            this.#storageError(lineNumber, "El severity debe escribirse en mayúsculas.", "ERROR", line);
            return;
        }

        // CASE 5: Si el severity no tiene los corchetes. Es una advertencia
        if (!bracketedSeverity) {
            this.#storageError(
                lineNumber,
                "El severity debe estar dentro de corchetes [].",
                "ADVERTENCIA",
                line
            );
            return;
        }

        // CASE 6: Si el severity no tiene un detalle.
        if (trimmedLine.slice(bracketedSeverity[0].length).trim().length === 0) {
            this.#storageError(lineNumber, "Severity sin detalle.", "ERROR", line);
            return;
        }
        // Analizo si puede existir un Case 7 en base a si tiene detalle y date...
        const strictMatch = trimmedLine.match(
            /^\[([A-Z]+)\] (\d{4}-\d{2}-\d{2}) (.+)$/
        );
        //Si no tiene veo exactamente donde esta el error...
        if (!strictMatch) {
            const afterSeverity = trimmedLine.slice(bracketedSeverity[0].length);
            const misplacedDate = afterSeverity.match(
                /^\s+(.+?)\s+(\d{4}-\d{2}-\d{2})$/
            );

            if (misplacedDate) {
                const description = misplacedDate[1].trim();
                // CASE 7: Fecha invalida. Analisis basico
                if (!this.#isRealDate(misplacedDate[2])) {
                    this.#storageError(
                        lineNumber,
                        "La fecha debe ser una fecha válida con formato YYYY-MM-DD.",
                        "ERROR",
                        line
                    );
                } else if (description.length < this.#MIN_CHARACTERS) {
                    // CASE 8: Descripcion corta.
                    this.#storageError(
                        lineNumber,
                        `La descripción debe tener al menos ${this.#MIN_CHARACTERS} caracteres.`,
                        "ERROR",
                        line
                    );
                } else if (description.length > this.#MAX_CHARACTERS) {
                    // CASE 9: Descripcion muy larga.
                    this.#storageError(
                        lineNumber,
                        `La descripción no puede superar ${this.#MAX_CHARACTERS} caracteres.`,
                        "ERROR",
                        line
                    );
                } else {
                    // CASE 10: Caso base de esto, por que puede que simplemente el date no este correctamente puesto.
                    this.#storageError(
                        lineNumber,
                        "La fecha debe aparecer inmediatamente después del severity.",
                        "ADVERTENCIA",
                        line
                    );
                }
                return;
            }
            
            const dateToken = trimmedLine.match(/^\[[A-Z]+\]\s+(\S+)(?:\s+|$)/)?.[1];
            if (dateToken && /^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(dateToken)) {
                if (!this.#VALID_DATE_FORMAT.test(dateToken)) {
                    // CASE 11: El formato directamente no cumple lo que pido.
                    this.#storageError(
                        lineNumber,
                        "La fecha debe tener el formato YYYY-MM-DD.",
                        "ERROR",
                        line
                    );
                    return;
                }
                if (!this.#isRealDate(dateToken)) {
                    this.#storageError(
                        lineNumber,
                        "La fecha debe ser una fecha válida con formato YYYY-MM-DD.",
                        "ERROR",
                        line
                    );
                    return;
                }
            }
            // CASE 12: El caso base. Puede que este todo revoltonado.
            this.#storageError(
                lineNumber,
                "Formato incorrecto. Se esperaba [SEVERITY] YYYY-MM-DD descripción, con espacios entre sus partes.",
                "ERROR",
                line
            );
            return;
        }
        // Aqui se repite el analisis anterior pero ahora se toma en cuenta que el formato [SEVERITY] YYYY-MM-DD descripción es correcto.
     
        const severityName = this.#severityAliases.get(strictMatch[1]);
        if (!severityName) {
            this.#storageError(lineNumber, `Severity incorrecto: "${strictMatch[1]}".`, "ERROR", line);
            return;
        }

        if (!this.#VALID_DATE_FORMAT.test(strictMatch[2]) || !this.#isRealDate(strictMatch[2])) {
            this.#storageError(
                lineNumber,
                "La fecha debe ser una fecha válida con formato YYYY-MM-DD.",
                "ERROR",
                line
            );
            return;
        }

        const description = strictMatch[3];
        if (description.length < this.#MIN_CHARACTERS) {
            this.#storageError(
                lineNumber,
                `La descripción debe tener al menos ${this.#MIN_CHARACTERS} caracteres.`,
                "ERROR",
                line
            );
            return;
        }
        if (description.length > this.#MAX_CHARACTERS) {
            this.#storageError(
                lineNumber,
                `La descripción no puede superar ${this.#MAX_CHARACTERS} caracteres.`,
                "ERROR",
                line
            );
            return;
        }

        this.#storageSeverity(severityName);
    }
    //Funcion para detectar fechas incorrectas.
    #isRealDate(date) {
        if (!this.#VALID_DATE_FORMAT.test(date)) {
            return false;
        }

        const [year, month, day] = date.split("-").map(Number);
        const daysInMonth = [
            31,
            year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31
        ];
        return month >= 1
            && month <= 12
            && day >= 1
            && day <= daysInMonth[month - 1];
    }
    //Funcion para imprimir. Debe de imprimir el total de Eventos detectados, la cantidad de eventos por tipos, el numero de lineas mal formateadas / incompletas y mostrar esas lineas e indicar que esta mal en el formato. Esta funcion solo SERA MOSTRAR.
    //Si se elige el modo automatico, se debe de preguntar al usuario que si quiere seguir analizando otros archivos LUEGO de que termine uno.
    #logSeverity(totalLines){
        const colorCode = hexColor => {
            const red = Number.parseInt(hexColor.slice(1, 3), 16);
            const green = Number.parseInt(hexColor.slice(3, 5), 16);
            const blue = Number.parseInt(hexColor.slice(5, 7), 16);
            return `\x1b[38;2;${red};${green};${blue}m`;
        };
        const colorize = (text, hexColor) => {
            return `${colorCode(hexColor)}${text}\x1b[0m`;
        };
        const warningColor = colorCode("#ebe713");
        const errorColor = colorCode("#eb0909");
        const resetColor = "\x1b[0m";

        console.log("\n========== RESULTADOS ==========");
        console.log("---Metricas:");
        console.log(`----> Total lineas analizadas: ${totalLines}.`);
        this.#SEVERITY_TYPES_LOGS.forEach(severity => {
            const label = severity.full === "WARNING" ? "WARNINGS" : severity.full;
            console.log(
                `----> ${colorize(label, severity.color)} detectados: ${severity.count}.`
            );
        });

        console.log("\n---Errores en el formato:");
        console.log(`----> Total de errores: ${this.#INVALID_COUNT}.`);
        console.log("-------");
        this.#INVALID_LINE.forEach(error => {
            const color = error.case === "ADVERTENCIA" ? warningColor : errorColor;
            console.log(`\n${color}[${error.case}] En la linea ${error.line}:${resetColor}`);
            console.log(`"${error.content}" . ${color}${error.message}${resetColor}`);
        });
        if (this.#INVALID_LINE.length > 0) {
            console.log("\n--------");
        }
    }

}

if (require.main === module) {
    //Si se quiere analizar un archivo especifico, se tiene que pasar como argumento de CMD.
    const analyzer = new CheckLogsEngine(process.argv[2] || "");
    analyzer.initChecking().catch(error => {
        console.error(`\x1b[31mError al analizar archivos: ${error.message}\x1b[0m`);
        process.exitCode = 1;
    });
}

module.exports = CheckLogsEngine;
