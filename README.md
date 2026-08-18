# Sistema RyF (Rápido y Fácil) 3.0 para Foundry VTT

> **This README is available in two languages:**
> - [English](#english-version) 🇬🇧
> - [Español](#versión-en-español) 🇪🇸

---

## English Version

### 📖 About

This is an implementation of the **Rápido y Fácil (Quick and Easy)** tabletop role-playing game system for Foundry Virtual Tabletop.

**Rápido y Fácil** is a generic RPG system created by the Rápido y Fácil community. You can learn more about the original system at [https://www.rapidoyfacil.es/](https://www.rapidoyfacil.es/).

This implementation is based on the rules published under the **Creative Commons Attribution-ShareAlike 4.0 International License**. For more information about the license, visit: [https://www.rapidoyfacil.es/que-es-ryf/](https://www.rapidoyfacil.es/que-es-ryf/#:~:text=se%20licencia%20bajo%20la%20que%20se%20distribuye)

### 🎲 How the System Works

**Rápido y Fácil** is a universal RPG system designed to be simple, fast, and adaptable to any genre or setting. The core mechanics include:

- **Attributes**: Characters have five core attributes (Physical, Dexterity, Intelligence, Perception, and optionally Charisma) that define their basic capabilities.
- **Skills**: Characters develop skills linked to attributes, representing their training and expertise in specific areas.
- **Roll Mechanic**: The system uses a unique **1-of-3d10** mechanic - roll three ten-sided dice and take the middle value (with advantage/disadvantage taking the highest/lowest). If you roll a 10, it explodes (roll again and add).
- **Success System**: Add your attribute + skill level + modifiers to your roll result. Compare against a difficulty number to determine success. The margin of success determines critical effects.
- **Combat**: Fast-paced combat with attack rolls, defense values, damage rolls, and armor absorption.
- **Magic**: Optional magic system with spells, mana costs, and spell levels.

### 🚀 Current Status

**Version**: 0.4.0 (In Development)

This project is currently implemented for **Foundry VTT v14** using **Application v1 (appV1)** architecture.

**Future Plans**: Migration to **Application v2** is planned for future iterations.

### 🛠️ Installation

#### For Players and Game Masters

1. Open Foundry VTT
2. Go to "Game Systems" tab
3. Click "Install System"
4. Search for "Rápido y Fácil" or paste the manifest URL
5. Click "Install"
6. Create a new world and select "Rápido y Fácil (RyF) 3.0" as the game system

#### For Developers

1. Clone or copy this repository to your Foundry data directory:
   ```
   [Foundry Data]/systems/ryf3/
   ```

2. Restart Foundry VTT

3. Create a new world selecting "Rápido y Fácil (RyF) 3.0" as the system

4. Compendium packs are built from the JSON sources in `packs/_source/` using the official Foundry CLI. With **Foundry closed**, run:
   ```bash
   npm install
   npm run pack     # compile packs/_source/* into the LevelDB packs Foundry loads
   npm run unpack   # extract pack contents back to JSON after editing them in Foundry
   ```

#### Releases

Releases are fully automated with GitHub Actions. To publish a new version:

```bash
git tag v0.4.0
git push origin v0.4.0
```

The workflow compiles the compendium packs, patches `system.json` with the tag version, builds `ryf3.zip` and publishes a GitHub Release. Foundry installations using the manifest URL (`https://github.com/mfventura/ryf/releases/latest/download/system.json`) pick up the update automatically. For playing, install the system through that manifest URL; a linked git clone is only needed for development (run `npm run pack` after pulling to rebuild the compendiums locally).

### 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, improving documentation, or translating content, your help is appreciated.

#### How to Contribute

1. **Fork and Branch**: Create a branch from the latest version of `main` for your work
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**: Implement your feature, fix, or improvement

3. **Reference the Original System**: Any development work **must reference the original Rápido y Fácil system**. In your code comments and pull request description, include:
   - The specific page number(s) from the official PDF where the rule or mechanic is explained
   - A brief explanation of how your implementation follows the official rules

   Example:
   ```javascript
   // Implementation of critical damage calculation
   // Reference: RyF 3.0 PDF, Page XX - "Daño Crítico"
   // Each 10 points above difficulty adds 1 critical die
   ```

4. **Create a Pull Request**: Submit a PR to the `main` branch with:
   - **Clear title**: Describe what you've done
   - **Detailed description**: Explain what changes you made and why
   - **PDF references**: Include page numbers from the official Rápido y Fácil rulebook
   - **Testing notes**: Describe how you tested your changes

#### What to Contribute

- � **Bug Fixes**: Found a bug? Fix it and submit a PR!
- ✨ **New Features**: Implement missing rules or mechanics from the official system
- 🌍 **Translations**: Help translate the system to other languages
- 📚 **Documentation**: Improve README, code comments, or user guides
- 🎨 **UI/UX Improvements**: Enhance the character sheets and interface
- 🧪 **Testing**: Write tests or report issues

#### Code Standards

- Write code in **English** (variables, functions, comments)
- **Do not write comments** unless necessary for complex logic or PDF references
- Follow the existing code style and structure
- Test your changes thoroughly before submitting

#### Questions or Ideas?

Open an issue to discuss your ideas before starting major work. We're happy to provide guidance and feedback!

### 📝 License

This system implementation is based on the **Rápido y Fácil 3.0** rules, which are published under the **Creative Commons Attribution-ShareAlike 4.0 International License** (CC BY-SA 4.0).

**Original System**: Rápido y Fácil by the Rápido y Fácil community - [https://www.rapidoyfacil.es/](https://www.rapidoyfacil.es/)

**Foundry VTT Implementation**: This code is also released under CC BY-SA 4.0.

### 🙏 Acknowledgments

- The **Rápido y Fácil community** for creating the system and releasing it under Creative Commons
- The **Foundry VTT community** for their excellent documentation and support
- All **contributors** who help improve this implementation

---

## Versión en Español

### 📖 Acerca de

Esta es una implementación del sistema de juego de rol de mesa **Rápido y Fácil** para Foundry Virtual Tabletop.

**Rápido y Fácil** es un sistema de rol genérico creado por la comunidad de Rápido y Fácil. Puedes conocer más sobre el sistema original en [https://www.rapidoyfacil.es/](https://www.rapidoyfacil.es/).

Esta implementación está basada en las reglas publicadas bajo la licencia **Creative Commons Reconocimiento-CompartirIgual 4.0 Internacional**. Para más información sobre la licencia, visita: [https://www.rapidoyfacil.es/que-es-ryf/](https://www.rapidoyfacil.es/que-es-ryf/#:~:text=se%20licencia%20bajo%20la%20que%20se%20distribuye)

### 🎲 Cómo Funciona el Sistema

**Rápido y Fácil** es un sistema de rol universal diseñado para ser simple, rápido y adaptable a cualquier género o ambientación. Las mecánicas principales incluyen:

- **Atributos**: Los personajes tienen cinco atributos básicos (Físico, Destreza, Inteligencia, Percepción y opcionalmente Carisma) que definen sus capacidades fundamentales.
- **Habilidades**: Los personajes desarrollan habilidades vinculadas a atributos, representando su entrenamiento y experiencia en áreas específicas.
- **Mecánica de Tirada**: El sistema usa una mecánica única de **1-de-3d10** - tira tres dados de diez caras y toma el valor medio (con ventaja/desventaja tomando el más alto/bajo). Si sacas un 10, explota (tira de nuevo y suma).
- **Sistema de Éxito**: Suma tu atributo + nivel de habilidad + modificadores al resultado de tu tirada. Compara contra un número de dificultad para determinar el éxito. El margen de éxito determina los efectos críticos.
- **Combate**: Combate dinámico con tiradas de ataque, valores de defensa, tiradas de daño y absorción de armadura.
- **Magia**: Sistema de magia opcional con hechizos, costes de maná y niveles de conjuro.

### 🚀 Estado Actual

**Versión**: 0.4.0 (En Desarrollo)

Este proyecto está actualmente implementado para **Foundry VTT v14** usando la arquitectura **Application v1 (appV1)**.

**Planes Futuros**: La migración a **Application v2** está planificada para futuras iteraciones.

### 🛠️ Instalación

#### Para Jugadores y Directores de Juego

1. Abre Foundry VTT
2. Ve a la pestaña "Game Systems"
3. Haz clic en "Install System"
4. Busca "Rápido y Fácil" o pega la URL del manifiesto
5. Haz clic en "Install"
6. Crea un nuevo mundo y selecciona "Rápido y Fácil (RyF) 3.0" como sistema de juego

#### Para Desarrolladores

1. Clona o copia este repositorio en tu directorio de datos de Foundry:
   ```
   [Foundry Data]/systems/ryf3/
   ```

2. Reinicia Foundry VTT

3. Crea un nuevo mundo seleccionando "Rápido y Fácil (RyF) 3.0" como sistema

4. Los compendios se construyen desde las fuentes JSON de `packs/_source/` con la CLI oficial de Foundry. Con **Foundry cerrado**, ejecuta:
   ```bash
   npm install
   npm run pack     # compila packs/_source/* a los packs LevelDB que carga Foundry
   npm run unpack   # extrae el contenido de los packs a JSON tras editarlos en Foundry
   ```

#### Releases

Las releases están automatizadas con GitHub Actions. Para publicar una versión:

```bash
git tag v0.4.0
git push origin v0.4.0
```

El workflow compila los compendios, parchea `system.json` con la versión del tag, construye `ryf3.zip` y publica la release en GitHub. Las instalaciones de Foundry que usan la URL de manifest (`https://github.com/mfventura/ryf/releases/latest/download/system.json`) reciben la actualización automáticamente. Para jugar, instala el sistema con esa URL de manifest; el clon de git vinculado solo hace falta para desarrollar (ejecuta `npm run pack` tras el pull para reconstruir los compendios en local).

### 🤝 Contribuir

¡Damos la bienvenida a contribuciones de la comunidad! Ya sea corrigiendo errores, añadiendo características, mejorando la documentación o traduciendo contenido, tu ayuda es apreciada.

#### Cómo Contribuir

1. **Fork y Rama**: Crea una rama desde la última versión de `main` para tu trabajo
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/nombre-de-tu-caracteristica
   ```

2. **Realiza tus Cambios**: Implementa tu característica, corrección o mejora

3. **Referencia al Sistema Original**: Cualquier trabajo de desarrollo **debe hacer referencia al sistema original Rápido y Fácil**. En los comentarios de tu código y en la descripción del pull request, incluye:
   - El número de página específico del PDF oficial donde se explica la regla o mecánica
   - Una breve explicación de cómo tu implementación sigue las reglas oficiales

   Ejemplo:
   ```javascript
   // Implementación del cálculo de daño crítico
   // Referencia: RyF 3.0 PDF, Página XX - "Daño Crítico"
   // Cada 10 puntos por encima de la dificultad añade 1 dado crítico
   ```

4. **Crea un Pull Request**: Envía un PR a la rama `main` con:
   - **Título claro**: Describe qué has hecho
   - **Descripción detallada**: Explica qué cambios hiciste y por qué
   - **Referencias al PDF**: Incluye números de página del manual oficial de Rápido y Fácil
   - **Notas de prueba**: Describe cómo probaste tus cambios

#### Qué Contribuir

- 🐛 **Corrección de Errores**: ¿Encontraste un bug? ¡Corrígelo y envía un PR!
- ✨ **Nuevas Características**: Implementa reglas o mecánicas faltantes del sistema oficial
- 🌍 **Traducciones**: Ayuda a traducir el sistema a otros idiomas
- 📚 **Documentación**: Mejora el README, comentarios de código o guías de usuario
- 🎨 **Mejoras de UI/UX**: Mejora las hojas de personaje y la interfaz
- 🧪 **Testing**: Escribe pruebas o reporta problemas

#### Estándares de Código

- Escribe código en **inglés** (variables, funciones, comentarios)
- **No escribas comentarios** a menos que sean necesarios para lógica compleja o referencias al PDF
- Sigue el estilo y estructura de código existente
- Prueba tus cambios exhaustivamente antes de enviarlos

#### ¿Preguntas o Ideas?

Abre un issue para discutir tus ideas antes de comenzar trabajos importantes. ¡Estaremos encantados de proporcionar orientación y feedback!

### 📝 Licencia

Esta implementación del sistema está basada en las reglas de **Rápido y Fácil 3.0**, que están publicadas bajo la licencia **Creative Commons Reconocimiento-CompartirIgual 4.0 Internacional** (CC BY-SA 4.0).

**Sistema Original**: Rápido y Fácil por la comunidad de Rápido y Fácil - [https://www.rapidoyfacil.es/](https://www.rapidoyfacil.es/)

**Implementación para Foundry VTT**: Este código también se publica bajo CC BY-SA 4.0.

### 🙏 Agradecimientos

- La **comunidad de Rápido y Fácil** por crear el sistema y publicarlo bajo Creative Commons
- La **comunidad de Foundry VTT** por su excelente documentación y soporte
- Todos los **contribuidores** que ayudan a mejorar esta implementación

---

**Made with ❤️ for the Rápido y Fácil and Foundry VTT communities**
