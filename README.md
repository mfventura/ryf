# Sistema RyF (Rápido y Fácil) 3.0 para Foundry VTT

Sistema de rol genérico "Rápido y Fácil" versión 3.0 implementado para Foundry Virtual Tabletop v13.

## 🎲 Características del Sistema

### Sistema de Tiradas Único: 1o3d10
- Tirar 3d10 y elegir la mediana (normal), máximo (ventaja) o mínimo (desventaja)
- Dados explosivos: 10 natural en el dado elegido explota
- Grados de éxito: cada 10 puntos sobre la dificultad añade +1d6 al efecto
- Sistema de pifias: 1 natural con segundo dado bajo

### Atributos (4-10)
- **Físico (F)**: Fuerza y resistencia física
- **Destreza (D)**: Agilidad y coordinación
- **Inteligencia (I)**: Razonamiento y conocimiento
- **Percepción (P)**: Sentidos y reflejos
- **Carisma (C)**: Presencia y persuasión *(opcional)*

### Habilidades (0-10)
- **39 habilidades base** organizadas por atributo
- **6 habilidades sociales** opcionales (requieren Carisma)
- Sistema de pirámides para creación de personaje
- Progresión con experiencia

### Valores Derivados
- **Puntos de Vida**: Físico × 4
- **Defensa**: Destreza + Esquivar + 5
- **Iniciativa**: Percepción + Reflejos + 1d10
- **Maná**: Inteligencia × 3 *(opcional)*

### Sistema de Combate
- Iniciativa con acciones múltiples (>= 20 = 2 acciones, >= 30 = 3 acciones)
- Ataques cuerpo a cuerpo vs Defensa
- Ataques a distancia vs dificultad por alcance (10/15/20/25)
- Daño con dados explosivos (6 natural en d6)
- Absorción de armadura
- Estados: Normal, Malherido, Inconsciente, Muerte

### Equipamiento
- **Armas**: Cuerpo a cuerpo y distancia con daño variable
- **Armaduras**: Absorción y estorbo
- **Escudos**: Bonificadores a defensa CC y distancia

### Módulos Opcionales
- **Sistema de Magia**: Hechizos con coste de maná y quemar maná para bonificadores
- **Habilidades Sociales**: Tiradas contra Voluntad del objetivo
- **Carisma**: Quinto atributo opcional

## 📁 Estructura del Proyecto

```
ryf/
├── css/                    # Estilos del sistema
├── lang/                   # Archivos de localización
│   └── es.json
├── module/                 # Código JavaScript
│   ├── documents/          # Clases Actor e Item
│   ├── helpers/            # Utilidades y configuración
│   ├── rolls/              # Sistema de tiradas
│   ├── sheets/             # Fichas de personaje e items
│   └── ryf.mjs            # Punto de entrada
├── templates/              # Templates Handlebars
│   ├── actor/              # Fichas de actores
│   ├── item/               # Fichas de items
│   └── chat/               # Mensajes de chat
├── system.json             # Manifiesto del sistema
├── template.json           # Modelo de datos
└── README.md
```

## 📋 Documentación

- **[PLAN_IMPLEMENTACION.md](PLAN_IMPLEMENTACION.md)**: Plan detallado de implementación en 10 fases (incluye Fase 0: Configuración)
- **[CONFIGURACION_SISTEMA.md](CONFIGURACION_SISTEMA.md)**: ⚠️ Sistema de configuración (CRÍTICO - implementar primero)
- **[HABILIDADES_REFERENCIA.md](HABILIDADES_REFERENCIA.md)**: Lista completa de las 45 habilidades
- **[MECANICAS_REFERENCIA.md](MECANICAS_REFERENCIA.md)**: Fórmulas y mecánicas del sistema
- **[sistema.txt](sistema.txt)**: Documento original con las reglas completas

## 🚀 Estado del Proyecto

**Versión actual**: 0.1.0 (En desarrollo)

### Roadmap

#### Sprint 0: Sistema de Configuración ⚠️ CRÍTICO
- [ ] Sistema de settings completo
- [ ] Configuración de Carisma (activar/desactivar)
- [ ] Configuración de Magia (activar/desactivar)
- [ ] Multiplicadores de Vida y Maná configurables
- [ ] Tipo de personaje y pirámides configurables
- [ ] Pirámide personalizada con formulario
- [ ] Funciones helper en config.mjs

#### Sprint 1: Fundamentos ⏳
- [ ] Estructura base del sistema
- [ ] system.json y template.json
- [ ] Clases de documentos básicas usando configuraciones
- [ ] Sistema cargable en Foundry

#### Sprint 2: Interfaz 📋
- [ ] Fichas de personaje y NPC
- [ ] Fichas de items (habilidad, arma, armadura, escudo, hechizo)
- [ ] Templates HTML/Handlebars
- [ ] CSS básico

#### Sprint 3: Mecánicas Core 🎲
- [ ] Sistema de tiradas 1o3d10
- [ ] Dados explosivos
- [ ] Sistema de combate
- [ ] Chat cards

#### Sprint 4: Equipamiento ⚔️
- [ ] Efectos de armaduras
- [ ] Efectos de escudos
- [ ] Gestión de armas

#### Sprint 5: Opcionales y Pulido ✨
- [ ] Sistema de magia
- [ ] Habilidades sociales
- [ ] Localización completa
- [ ] Testing exhaustivo

## 🛠️ Instalación (Desarrollo)

1. Clonar o copiar este directorio en:
   ```
   [Foundry Data]/systems/ryf/
   ```

2. Reiniciar Foundry VTT

3. Crear un nuevo mundo seleccionando "Rápido y Fácil (RyF) 3.0" como sistema

## 🎮 Uso

### Creación de Personaje

1. Crear un nuevo Actor de tipo "Personaje"
2. Asignar puntos de atributos:
   - Heroico: 30 puntos (rango 4-10)
   - Realista: 22 puntos (rango 4-10)
3. Añadir habilidades según la pirámide elegida:
   - Especialista Heroico: 1×6, 3×5, 3×4, 3×3, 3×2, 3×1
   - Versátil Heroico: 1×6, 2×5, 3×4, 4×3, 5×2, 6×1
   - Especialista Realista: 2×5, 2×4, 2×3, 2×2, 2×1
   - Versátil Realista: 1×5, 2×4, 3×3, 4×2, 5×1
4. Equipar armas, armaduras y escudos

### Realizar Tiradas

1. Hacer clic en una habilidad en la ficha de personaje
2. Seleccionar dificultad (Fácil 10, Normal 15, Moderada 18, Difícil 20, Muy Difícil 25, Casi Imposible 30)
3. Elegir modo (Normal, Ventaja, Desventaja)
4. El sistema calcula automáticamente:
   - Tirada 1o3d10 con explosión
   - Suma de Atributo + Habilidad + Dado
   - Éxito/Fallo
   - Grados de éxito (críticos)
   - Pifias

### Combate

1. Añadir combatientes al tracker de combate
2. Tirar iniciativa (automático: Percepción + Reflejos + 1d10)
3. En tu turno:
   - **Ataque CC**: Hacer clic en arma cuerpo a cuerpo → Seleccionar objetivo
   - **Ataque Distancia**: Hacer clic en arma a distancia → Seleccionar alcance
4. Si impacta, tirar daño automáticamente con dados críticos
5. Aplicar daño al objetivo (restar absorción de armadura)

## 🧪 Testing

Ver [PLAN_IMPLEMENTACION.md](PLAN_IMPLEMENTACION.md) sección 9.3 para la lista completa de casos de prueba.

## 📝 Licencia

Este sistema está basado en las reglas del juego de rol "Rápido y Fácil" 3.0.

El código de implementación para Foundry VTT está disponible bajo licencia [pendiente de definir].

## 🤝 Contribuciones

Este proyecto está en desarrollo activo. Las contribuciones son bienvenidas.

## 📞 Contacto

[Pendiente de definir]

## 🙏 Agradecimientos

- **Sistemas de referencia**:
  - ZETS: Estructura moderna para Foundry v13
  - TRUE-d6: Buenas prácticas y sistema de tiradas personalizado

- **Foundry VTT**: Por proporcionar una plataforma excelente para sistemas de rol

---

**Nota**: Este sistema está en desarrollo. Las características listadas representan el plan completo, no todas están implementadas aún. Ver el roadmap arriba para el estado actual.

