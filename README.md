# Analizador de Logs y errores de formato
Como parte de la actividad de la tercera semana, se desarrollo un analizador de logs y de formato con el principio de AI-First para comprender la importancia del involucramiento humando en las decisiones cruciales y el uso de la IA como herramiento y no como orquestador principal.


## Involucramiento humanos

Primero, necesite recordarme de las herramientas que nos provee Node.js para acceder a directorios del sistema y leer lineas de texto para conocer el area que tiene que trabajar la IA y las limitantes.
Luego estableci las funcionalidades principales del analizador, que aparte de la idea principal que es analizador logs le incorpore una deteccion automatica de archivos txt dentro del directorio "ArchivosPrueba" sin necesidad de esa tarea manual de indicarle que archivo analizar. Igualmente esa funcionalidad se la deje como una funcionalidad legacy

Por siguiente, empece a establecer la estructura principal del codigo manualmente. Gracias a que estableci la logica primero y que ya tenia experiencia orquestando flujos de trabajo orqueste el siguiente codigo como estructura skeleton:
------
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

    constructor(url = '') {
        this.#fileUrl = url;       
    }
    //Funcion principal
    initChecking(){
        const initUrl = this.#fileUrl != "" ? this.#fileUrl : "/ArchivosPrueba";
        
    }
    //Funciones auxiliares. 
    //Funcion para guardar en base a que severity es. Unicamente lleva el contador de los serveritys y los aumenta si tienen el formato correcto.
    #storageSeverity(){

    }
    //Funcion para guardar y llevar el conteo de las lineas invalidas. Unicamente para guardar
    #storageError(){

    }
    //Funcion para analizar el formato 
    //Aqui adentro tambien ira la deteccion de la fecha, si esta mal formateada. Aqui contendra todas las instrucciones que te he mencionado.
    #checkFormat(){
        
    }
    //Funcion para imprimir. Debe de imprimir el total de Eventos detectados, la cantidad de eventos por tipos, el numero de lineas mal formateadas / incompletas y mostrar esas lineas e indicar que esta mal en el formato. Esta funcion solo SERA MOSTRAR.
    //Si se elige el modo automatico, se debe de preguntar al usuario que si quiere seguir analizando otros archivos LUEGO de que termine uno.
    #logSeverity(){

    }

}

//Tiene que haber dos casos de prueba:
const analizerWithUrl = new CheckLogsEngine("./archivoX.txt"); //Cuando se analiza directamente un archivo especifico.
const analizerWithoutUrl = new CheckLogsEngine(); //O cuando se decide analizar todo un directorio donde hay varios archivos.
------
Con esto, hago los cimientos donde la IA debe de trabajar y asi evitar contextos incoherentes de logica.

Proximo a esto empece a crear el Prompt Estructurado siguiendo la estrategia de Few Shot (integracion de varios ejemplos) delimitando el area de trabajo de la IA.

Dentro de ese prompt establezco la arquitectura general de los logs, el formato que deben de seguir, los casos de borde (que yo los tomo como ADVERTENCIAS) y los casos aceptables. Tambien restricciones directas de la IA.

## Involucramiento de la IA

Ocupe el Agente Copilot en su version gratuita en VS Code en modo agent para generar el codigo funcional del analizador en base a la arquitectura general que le plantie en el codigo. 
### Prompt Estructurado
-#Personalidad
Eres un desarrollador senior en entorno Node.js, backend en general y conoces los principios ACID, SOLID y de optimización de código para JavaScript.

-#Instruccion

Necesito que completes mi clase analizador de logs automatico (los archivos estarán en el directorio ArchivosPrueba) o de archivo unico. En el código esta explicado la estructura general de la clase y que funciones ocupas para generar el flujo correcto.
Este analizador tiene como propósito, en base a un archivo.txt, detectar los logs y categorizarlos en base a su severity, también detectar líneas con formato incorrecto y dejar señalizado donde esta ese error. Si entra en el modo automático, cada vez que analice un archivo nuevo debe de pedirle confirmación al usuario para seguir 

-#Ejemplos

Se espera que dentro del txt exista este formato:
· [INFO] 2025-01-10 User logged in
· [ERROR] 2025-01-10 Failed to connect to database
· [WARNING] Invalid password attempt.

-#Reglas

Cada linea debe de contener: 
- El log severity dentro de corchetes [].
- Seguido de la fecha de la forma YYYY-MM-DD.
- Descripción. Máximo 250 caracteres. Minimo 10 caracteres.
- Debe de existir espacios entre caracteres. Ejemplo: "[SEVERITY] DATE DESCRCIPCION".

Se considera como error en el formato CUALQUIER linea que no cumpla con el ejemplo que te mande o con las variables para validaciones.
Dentro del error del formato pueden existir:
- Advertencia (Edge cases): 
	- La fecha no va después del severity. Ejemplo: "[WARNING] Invalid Password Attempt 2020-01-02"
 	- El Severity no va dentro de corchetes. Ejemplo: "WARN 2020-01-02 Invalid Password Attempt"

- Errores:
	- Cuando no se cumple estrictamente las reglas que te mande anteriormente o el formato estipulado en las variables de validación. Ejemplo: Sobrepasa el limite de caracteres. No es 	un archivo.txt, incorrecto nombre a los severity
	- El Severity va en minúsculas. Ejemplo: "[warn] 2020-01-02 Invalid Password Attempt".
	- La fecha no tiene el formato correcto. Ejemplo: "[WARN] 2020/01/02 Invalid Password Attempt".
	- Cualquier linea vacia o con texto que no este ligada a ningún severity.
	- Un severity sin detalle. Ejemplo: "[WARN] " 

#Impresion
Debes de imprimir mensajes cuando se detecte algún error en el formato. Este mensaje debe de ser acorde a la descripción del error, si es de advertencia (Edge Cases) o si es Error directo. Existen colores que debes de respetar estrictamente al momento de imprimirlo en la consola de Node.js.

El formato de impresión debe de seguir esto:

========== RESULTADOS ==========
---Metricas:
----> Total lineas analizadas: XX.
----> INFO detectados: XX.
----> WARNINGS detectados: XX.
----> ERROR detectados: XX.

---Errores en el formato:
----> Total de errores: XX.
-------

[ADVERTENCIA || ERROR] En la linea XX : 

"[warn] 2020-01-02 Invalid Password Attempt" . Severity sin mayuscula.

--------

-#Restricciones

- No debes de generar ni crear código que agregue complejidad innecesaria.
- No crees archivos nuevos
- Debes de seguir mi estructura que te asigne.
- No ejecutes comandos en consola que no sea de testing.
- No generes archivos de testing.
- Para acceder al directorio ocupa funciones nativas de Node.js. No descargues librerías para esto.

# Errores Corregidos

Al delimitar bastante y decirle explicitamente a la IA que camino tomar los errores se reducen drasticamente.

Igualmente fui capaz de detectar dos errores dentro del codigo:
- La deteccion de una linea vacia se debe de considerar una ADVERTENCIA dentro de los errores de formato. Corregi el mensaje y el case.
- La fecha no validaba correctamente los meses (se ajustaba como 11, omitiendo el mes 12).

# Aprendizaje

Con este mindset, fui capaz de desarrollar este analizador en 30 minutos, donde me lleve mas tiempo creando el prompt, la arquitectura skeleton del archivo y analizando el codigo que la propia IA generando el codigo. Considero que es un tiempo bastante aceptable para lo que se trata de crear proyectos con IA, ya que siempre se necesita un involucramiento humano y eso conlleva tiempo. 

Los resultados de la IA mejoran muchisimo cuando se define una estructura clara, limitaciones y reglas de negocio por cuenta propia, ya que se evita de esa problematica de pensar que la IA te va a entender tu proyecto y eliminas esa brecha de seguridad donde la IA puede omitir casos que tu si necesitas contemplar.

# Comandos de inicializacion

Para iniciar el proyecto en el cmd

npm run dev 

Para analizar un archivo especifico


