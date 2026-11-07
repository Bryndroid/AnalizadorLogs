# Analizador de logs y errores de formato

Como parte de la actividad de la tercera semana, desarrollé un analizador de logs y de formato siguiendo el principio AI-First. El objetivo fue comprender la importancia del involucramiento humano en las decisiones cruciales y el uso de la IA como herramienta, no como orquestador principal.

## Involucramiento humano

Primero, necesité recordar las herramientas que Node.js proporciona para acceder a los directorios del sistema y leer líneas de texto. Esto me permitió delimitar el área en la que debía trabajar la IA y establecer sus limitaciones.

Luego, definí las funcionalidades principales del analizador. Además de su propósito principal (analizar logs), incorporé la detección automática de archivos `.txt` dentro del directorio `ArchivosPrueba`, sin necesidad de indicarle manualmente qué archivo debía analizar. También conservé la posibilidad de analizar un archivo específico como funcionalidad alternativa (legacy).

A continuación, empecé a establecer manualmente la estructura principal del código. Como primero definí la lógica y ya tenía experiencia orquestando flujos de trabajo, preparé el siguiente esqueleto (skeleton) para que la IA trabajara sobre una base clara:

```javascript
class CheckLogsEngine {
    // VARIABLES PARA VALIDACIONES.
    #VALID_DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
    #MAX_CHARACTERS = 250;
    #MIN_CHARACTERS = 10;
    #VALID_FORMAT = 'txt'; // Únicamente vamos a leer archivos TXT.

    // STORAGE DE SEVERITIES
    #SEVERITY_TYPES_LOGS = [{
        full: "INFO",
        redu: "INF",
        color: "#1713eb",
        count: 0
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
    #INVALID_LINE = []; // Aquí se guardará la línea con el error y su mensaje.
                          // Estructura: { line: 0, message: "default", case: '' }.
                          // En case únicamente puede ser ADVERTENCIA o ERROR.

    #fileUrl;

    constructor(url = '') {
        this.#fileUrl = url;
    }

    // Función principal.
    initChecking() {
        const initUrl = this.#fileUrl !== "" ? this.#fileUrl : "./ArchivosPrueba";
    }

    // Funciones auxiliares.

    // Guarda y aumenta el contador según el severity,
    // siempre que el formato sea correcto.
    #storageSeverity() {

    }

    // Guarda y lleva el conteo de las líneas inválidas.
    #storageError() {

    }

    // Analiza el formato.
    // También contiene la detección y validación de la fecha.
    #checkFormat() {

    }

    // Imprime el total de eventos detectados, la cantidad de eventos
    // por tipo y el número de líneas mal formateadas o incompletas.
    // También muestra las líneas afectadas e indica qué está mal.
    // Esta función únicamente se encarga de mostrar los resultados.
    //
    // Si se elige el modo automático, debe preguntar al usuario
    // si desea continuar analizando otros archivos después de terminar uno.
    #logSeverity() {

    }
}

// Casos de prueba:
const analizerWithUrl = new CheckLogsEngine("./archivoX.txt");
// Analiza directamente un archivo específico.

const analizerWithoutUrl = new CheckLogsEngine();
// Analiza todos los archivos del directorio indicado.
```

Con esta estructura establecí los cimientos sobre los que debía trabajar la IA. De esta manera, evité que generara una lógica incoherente con el funcionamiento que tenía pensado.

Después, empecé a crear el prompt estructurado siguiendo la estrategia Few-Shot (integración de varios ejemplos), con el objetivo de delimitar aún más el área de trabajo de la IA.

En ese prompt establecí la arquitectura general de los logs, el formato que debían seguir, los casos de borde (que clasifiqué como advertencias), los casos aceptables y las restricciones directas para la IA.

## Involucramiento de la IA

Utilicé el agente Copilot, en su versión gratuita dentro de VS Code y en modo Agent, para generar el código funcional del analizador a partir de la arquitectura general que había planteado en el código.

### Prompt estructurado

**Personalidad**

Eres un desarrollador sénior especializado en Node.js y desarrollo backend. Conoces los principios ACID y SOLID, así como las buenas prácticas de optimización de código JavaScript.

**Instrucción**

Necesito que completes mi clase analizadora de logs, tanto para el modo automático (los archivos estarán en el directorio `ArchivosPrueba`) como para el análisis de un único archivo. En el código está explicada la estructura general de la clase y las funciones que necesitas implementar para generar el flujo correcto.

Este analizador tiene como propósito leer un archivo `.txt`, detectar los logs y categorizarlos según su severity. También debe detectar las líneas con formato incorrecto e indicar dónde se encuentra cada error.

Si se utiliza el modo automático, cada vez que termine de analizar un archivo debe pedirle confirmación al usuario para continuar con el siguiente.

**Ejemplos**

Se espera que dentro del archivo `.txt` existan líneas con este formato:

- `[INFO] 2025-01-10 User logged in`
- `[ERROR] 2025-01-10 Failed to connect to database`
- `[WARNING] 2025-01-10 Invalid password attempt`

**Reglas**

Cada línea debe contener:

- El nivel de severidad (severity) dentro de corchetes `[]`.
- La fecha inmediatamente después del severity, con el formato `YYYY-MM-DD`.
- Una descripción de entre 10 y 250 caracteres.
- Espacios entre cada elemento. Ejemplo: `[SEVERITY] DATE DESCRIPTION`.

Se considera un error de formato cualquier línea que no cumpla con las reglas anteriores o con las variables de validación definidas en la clase.

Los problemas de formato se clasifican de la siguiente manera:

**Advertencias (casos de borde):**

- La fecha no aparece después del severity. Ejemplo: `[WARNING] Invalid Password Attempt 2020-01-02`.
- El severity no está dentro de corchetes. Ejemplo: `WARN 2020-01-02 Invalid Password Attempt`.

**Errores:**

- No se cumplen estrictamente las reglas indicadas o el formato estipulado en las variables de validación. Por ejemplo: se supera el límite de caracteres, el archivo no es `.txt` o se utiliza un nombre de severity incorrecto.
- El severity está escrito en minúsculas. Ejemplo: `[warn] 2020-01-02 Invalid Password Attempt`.
- La fecha no tiene el formato correcto. Ejemplo: `[WARN] 2020/01/02 Invalid Password Attempt`.
- La línea está vacía o contiene texto que no está asociado a ningún severity.
- El severity no tiene una descripción. Ejemplo: `[WARN] `.

**Impresión**

Debes imprimir mensajes cuando se detecte algún error de formato. El mensaje debe corresponder a la descripción del problema e indicar si se trata de una advertencia (edge case) o de un error directo.

Debes respetar estrictamente los colores definidos para cada tipo de severidad al imprimir los resultados en la consola de Node.js.

El formato de impresión debe seguir esta estructura:

```text
========== RESULTADOS ==========
--- Métricas:
----> Total de líneas analizadas: XX.
----> INFO detectados: XX.
----> WARNINGS detectados: XX.
----> ERROR detectados: XX.

--- Errores en el formato:
----> Total de errores: XX.

[ADVERTENCIA || ERROR] En la línea XX:

"[warn] 2020-01-02 Invalid Password Attempt".
Motivo: el severity no está escrito en mayúsculas.

--------
```

**Restricciones**

- No debes generar ni crear código que agregue complejidad innecesaria.
- No crees archivos nuevos.
- Debes seguir la estructura que te asigné.
- No ejecutes comandos en la consola que no sean de testing.
- No generes archivos de testing.
- Para acceder al directorio, utiliza funciones nativas de Node.js. No descargues librerías para esta tarea.

## Errores corregidos

Al delimitar el contexto y especificar explícitamente a la IA qué camino debía seguir, los errores se redujeron considerablemente.

Igualmente, fui capaz de detectar dos errores dentro del código:

- La detección de una línea vacía debía considerarse una **ADVERTENCIA** dentro de los errores de formato. Corregí tanto el mensaje como el tipo de caso (`case`).
- La validación de la fecha no comprobaba correctamente los meses: el límite superior estaba configurado de forma que se omitía el mes 12. Corregí esa validación.

## Aprendizaje

Con esta metodología, fui capaz de desarrollar el analizador en aproximadamente 30 minutos. Invertí más tiempo en crear el prompt, definir la arquitectura inicial (skeleton) y analizar el código generado por la IA que en escribir el código funcional.

Considero que es un tiempo bastante aceptable para el desarrollo de proyectos con IA, ya que siempre se necesita involucramiento humano y eso también requiere tiempo.

Los resultados de la IA mejoran considerablemente cuando se define previamente una estructura clara, junto con las limitaciones y las reglas de negocio. Así se evita asumir que la IA entenderá automáticamente el proyecto y se reduce el riesgo de que omita casos que sí es necesario contemplar.

## Comandos de inicialización

Para iniciar el proyecto desde CMD:

```bash
npm run dev
```

Para analizar un archivo específico:

```bash
node index.js pruebaArchivoDirecto.txt
```