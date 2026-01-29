const packName = "ryf3.compendiumkey";
const pack = game.packs.get(packName);

if (!pack) {
  ui.notifications.error(`No se encontró el compendio: ${packName}`);
} else {
  const documents = await pack.getDocuments();
  
  if (documents.length === 0) {
    ui.notifications.info("El compendio ya está vacío");
  } else {
    const confirmar = await Dialog.confirm({
      title: "Confirmar Limpieza",
      content: `<p>¿Estás seguro de que quieres eliminar <strong>${documents.length}</strong> elementos del compendio <strong>${pack.metadata.label}</strong>?</p><p>Esta acción no se puede deshacer.</p>`,
      yes: () => true,
      no: () => false
    });
    
    if (confirmar) {
      for (const doc of documents) {
        await doc.delete();
        console.log(`Eliminado: ${doc.name}`);
      }
      ui.notifications.info(`Se eliminaron ${documents.length} elementos del compendio`);
    } else {
      ui.notifications.info("Operación cancelada");
    }
  }
}