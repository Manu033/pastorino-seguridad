import React, { useEffect, useState } from "react";
import { AppHeader, Tabs } from "./components/AppHeader.jsx";
import { Status } from "./components/ui.jsx";
import { CategoriasTab } from "./features/categorias/CategoriasTab.jsx";
import { CotizacionModal } from "./features/cotizaciones/CotizacionModal.jsx";
import { CotizacionesTab } from "./features/cotizaciones/CotizacionesTab.jsx";
import { calcularCompraProducto } from "./features/cotizaciones/unidades.js";
import { ImportacionesTab } from "./features/importaciones/ImportacionesTab.jsx";
import { HistorialPreciosTab } from "./features/precios/HistorialPreciosTab.jsx";
import { ProductoModal } from "./features/productos/ProductoModal.jsx";
import { ProductosTab } from "./features/productos/ProductosTab.jsx";
import { ProveedorModal } from "./features/proveedores/ProveedorModal.jsx";
import { ProveedoresTab } from "./features/proveedores/ProveedoresTab.jsx";
import { useAppState } from "./hooks/useAppState.js";
import { useBaseData } from "./hooks/useBaseData.js";
import { useHealth } from "./hooks/useHealth.js";
import { useProductosBusqueda } from "./hooks/useProductosBusqueda.js";
import { useCategorias } from "./features/categorias/useCategorias.js";
import { useCotizaciones } from "./features/cotizaciones/useCotizaciones.js";
import { useImportaciones } from "./features/importaciones/useImportaciones.js";
import { useHistorial } from "./features/precios/useHistorial.js";
import { useProductos } from "./features/productos/useProductos.js";
import { useProductosCompuestos } from "./features/productos/useProductosCompuestos.js";
import { ClasificacionTab } from "./features/clasificacion/ClasificacionTab.jsx";
import { useClasificacion } from "./features/clasificacion/useClasificacion.js";
import { useProveedores } from "./features/proveedores/useProveedores.js";

const TABS = [
  ["proveedores", "Proveedores"],
  ["categorias", "Categorias"],
  ["productosProveedor", "Productos"],
  ["clasificacion", "Clasificación"],
  ["cotizaciones", "Cotizaciones"],
  ["historial", "Precios"],
  ["importaciones", "Importacion JSON"],
];

function App() {
  const [activeTab, setActiveTab] = useState("proveedores");

  const app = useAppState();
  const health = useHealth();
  const baseData = useBaseData(app.apiUrl, app.run);
  const busqueda = useProductosBusqueda(app.apiUrl);

  const proveedores = useProveedores({
    apiUrl: app.apiUrl,
    run: app.run,
    setError: app.setError,
    loadBaseData: baseData.loadBaseData,
  });

  const categorias = useCategorias({
    apiUrl: app.apiUrl,
    run: app.run,
    loadBaseData: baseData.loadBaseData,
  });

  const productos = useProductos({
    apiUrl: app.apiUrl,
    run: app.run,
    setError: app.setError,
    subcategorias: baseData.subcategorias,
    loadProductosBusqueda: busqueda.loadProductosBusqueda,
  });

  const cotizaciones = useCotizaciones({
    apiUrl: app.apiUrl,
    run: app.run,
    setError: app.setError,
    dolarVenta: health.dolarVenta,
    productosBusqueda: busqueda.productosBusqueda,
  });

  const historial = useHistorial({
    apiUrl: app.apiUrl,
    run: app.run,
    setError: app.setError,
    productosBusqueda: busqueda.productosBusqueda,
  });

  const clasificacion = useClasificacion({
    apiUrl: app.apiUrl,
    run: app.run,
    setError: app.setError,
    subcategorias: baseData.subcategorias,
  });

  const compuestos = useProductosCompuestos({
    apiUrl: app.apiUrl,
    run: app.run,
    setError: app.setError,
    subcategorias: baseData.subcategorias,
    loadProductosBusqueda: busqueda.loadProductosBusqueda,
  });

  const importaciones = useImportaciones({
    apiUrl: app.apiUrl,
    run: app.run,
    loadProductosBusqueda: busqueda.loadProductosBusqueda,
    loadProductosProveedor: productos.loadProductosProveedor,
  });

  useEffect(() => {
    baseData.loadBaseData();
    productos.loadProductosProveedor();
    busqueda.loadProductosBusqueda();
    cotizaciones.loadCotizaciones();
    compuestos.loadCompuestos();
    health.checkHealth(app.apiUrl, app.run);
    health.loadDolarOficial();
  }, []);

  return (
    <main>
      <AppHeader
        apiUrl={app.apiUrl}
        setApiUrl={app.setApiUrl}
        checkHealth={() => health.checkHealth(app.apiUrl, app.run)}
        health={health.health}
        dolarOficial={health.dolarOficial}
        dolarError={health.dolarError}
      />

      <Tabs tabs={TABS} activeTab={activeTab} setActiveTab={setActiveTab} />

      <Status message={app.status} error={app.error} />
      {app.loading && <div className="loading">Procesando...</div>}

      {activeTab === "proveedores" && (
        <ProveedoresTab
          proveedorForm={proveedores.proveedorForm}
          setProveedorForm={proveedores.setProveedorForm}
          editing={proveedores.editing}
          setEditing={proveedores.setEditing}
          saveProveedor={proveedores.saveProveedor}
          proveedorModalOpen={proveedores.proveedorModalOpen}
          openNuevoProveedorModal={proveedores.openNuevoProveedorModal}
          closeNuevoProveedorModal={proveedores.closeNuevoProveedorModal}
          loadBaseData={baseData.loadBaseData}
          filters={productos.filters}
          setFilters={productos.setFilters}
          proveedores={baseData.proveedores}
          openProveedorModal={proveedores.openProveedorModal}
          softDelete={proveedores.softDelete}
        />
      )}

      {activeTab === "categorias" && (
        <CategoriasTab
          categoriaForm={categorias.categoriaForm}
          setCategoriaForm={categorias.setCategoriaForm}
          subcategoriaForm={categorias.subcategoriaForm}
          setSubcategoriaForm={categorias.setSubcategoriaForm}
          editing={categorias.editing}
          setEditing={categorias.setEditing}
          saveCategoria={categorias.saveCategoria}
          saveSubcategoria={categorias.saveSubcategoria}
          loadBaseData={baseData.loadBaseData}
          categorias={baseData.categorias}
          subcategorias={baseData.subcategorias}
        />
      )}

      {activeTab === "productosProveedor" && (
        <ProductosTab
          productoProveedorForm={productos.productoProveedorForm}
          setProductoProveedorForm={productos.setProductoProveedorForm}
          editing={productos.editing}
          setEditing={productos.setEditing}
          saveProductoProveedor={productos.saveProductoProveedor}
          productoProveedorModalOpen={productos.productoProveedorModalOpen}
          openNuevoProductoModal={productos.openNuevoProductoModal}
          closeNuevoProductoModal={productos.closeNuevoProductoModal}
          proveedores={baseData.proveedores}
          categorias={baseData.categorias}
          subcategorias={baseData.subcategorias}
          subcategoriasProductoProveedor={productos.subcategoriasProductoProveedor}
          filters={productos.filters}
          setFilters={productos.setFilters}
          searchProductosProveedor={productos.searchProductosProveedor}
          productosProveedorMeta={productos.productosProveedorMeta}
          goProductosPage={productos.goProductosPage}
          productosProveedor={productos.productosProveedor}
          openProductoModal={productos.openProductoModal}
          compuestos={compuestos.compuestos}
          compuestoForm={compuestos.compuestoForm}
          setCompuestoForm={compuestos.setCompuestoForm}
          compuestoItems={compuestos.compuestoItems}
          compuestoItemForm={compuestos.compuestoItemForm}
          setCompuestoItemForm={compuestos.setCompuestoItemForm}
          subcategoriasCompuesto={compuestos.subcategoriasCompuesto}
          compuestoModalOpen={compuestos.compuestoModalOpen}
          editingCompuesto={compuestos.editingCompuesto}
          saveCompuesto={compuestos.saveCompuesto}
          addItemToCompuesto={compuestos.addItemToCompuesto}
          removeItemFromCompuesto={compuestos.removeItemFromCompuesto}
          openNuevoCompuestoModal={compuestos.openNuevoCompuestoModal}
          openEditCompuestoModal={compuestos.openEditCompuestoModal}
          closeCompuestoModal={compuestos.closeCompuestoModal}
          productosBusqueda={busqueda.productosBusqueda}
        />
      )}

      {activeTab === "clasificacion" && (
        <ClasificacionTab
          productos={clasificacion.productos}
          loading={clasificacion.loading}
          filters={clasificacion.filters}
          setFilters={clasificacion.setFilters}
          cargarProductos={clasificacion.cargarProductos}
          seleccionados={clasificacion.seleccionados}
          toggleSeleccion={clasificacion.toggleSeleccion}
          toggleTodos={clasificacion.toggleTodos}
          categoriaAsignar={clasificacion.categoriaAsignar}
          setCategoriaAsignar={clasificacion.setCategoriaAsignar}
          subcategoriaAsignar={clasificacion.subcategoriaAsignar}
          setSubcategoriaAsignar={clasificacion.setSubcategoriaAsignar}
          subcategoriasDisponibles={clasificacion.subcategoriasDisponibles}
          aplicarCategoria={clasificacion.aplicarCategoria}
          limpiarCategoria={clasificacion.limpiarCategoria}
          proveedores={baseData.proveedores}
          categorias={baseData.categorias}
          productoEditar={clasificacion.productoEditar}
          abrirModalEditar={clasificacion.abrirModalEditar}
          cerrarModalEditar={clasificacion.cerrarModalEditar}
          categoriaEditar={clasificacion.categoriaEditar}
          setCategoriaEditar={clasificacion.setCategoriaEditar}
          subcategoriaEditar={clasificacion.subcategoriaEditar}
          setSubcategoriaEditar={clasificacion.setSubcategoriaEditar}
          subcategoriasEditar={clasificacion.subcategoriasEditar}
          guardarEdicion={clasificacion.guardarEdicion}
        />
      )}

      {activeTab === "cotizaciones" && (
        <CotizacionesTab
          saveCotizacion={cotizaciones.saveCotizacion}
          cotizacionForm={cotizaciones.cotizacionForm}
          setCotizacionForm={cotizaciones.setCotizacionForm}
          setCotizacionItems={cotizaciones.setCotizacionItems}
          cotizacionResumen={cotizaciones.cotizacionResumen}
          dolarVenta={health.dolarVenta}
          addProductoCotizacion={cotizaciones.addProductoCotizacion}
          cotizacionProducto={cotizaciones.cotizacionProducto}
          setCotizacionProducto={cotizaciones.setCotizacionProducto}
          setCotizacionDropdownOpen={cotizaciones.setCotizacionDropdownOpen}
          proveedores={baseData.proveedores}
          categorias={baseData.categorias}
          subcategorias={baseData.subcategorias}
          productosCotizacion={cotizaciones.productosCotizacion}
          cotizacionDropdownOpen={cotizaciones.cotizacionDropdownOpen}
          productoCotizacionSeleccionado={cotizaciones.productoCotizacionSeleccionado}
          calcularCompraProducto={calcularCompraProducto}
          addManualCotizacion={cotizaciones.addManualCotizacion}
          cotizacionManual={cotizaciones.cotizacionManual}
          setCotizacionManual={cotizaciones.setCotizacionManual}
          addManoObraCotizacion={cotizaciones.addManoObraCotizacion}
          cotizacionManoObra={cotizaciones.cotizacionManoObra}
          setCotizacionManoObra={cotizaciones.setCotizacionManoObra}
          priceToUsd={cotizaciones.priceToUsd}
          cotizacionItems={cotizaciones.cotizacionItems}
          cotizaciones={cotizaciones.cotizaciones}
          cotizacionesFiltradas={cotizaciones.cotizacionesFiltradas}
          estadoFiltro={cotizaciones.estadoFiltro}
          setEstadoFiltro={cotizaciones.setEstadoFiltro}
          searchQuery={cotizaciones.searchQuery}
          setSearchQuery={cotizaciones.setSearchQuery}
          loadCotizaciones={cotizaciones.loadCotizaciones}
          openCotizacion={cotizaciones.openCotizacion}
          clearCotizacionDraft={cotizaciones.clearCotizacionDraft}
          cotizacionEditId={cotizaciones.cotizacionEditId}
          cotizacionWizardOpen={cotizaciones.cotizacionWizardOpen}
          setCotizacionWizardOpen={cotizaciones.setCotizacionWizardOpen}
          printCotizacionById={cotizaciones.printCotizacionById}
          apiUrl={app.apiUrl}
        />
      )}

      {activeTab === "historial" && (
        <HistorialPreciosTab
          loadHistorial={historial.loadHistorial}
          historialFilters={historial.historialFilters}
          setHistorialFilters={historial.setHistorialFilters}
          proveedores={baseData.proveedores}
          productosHistorial={historial.productosHistorial}
          historialId={historial.historialId}
          setHistorialId={historial.setHistorialId}
          historialDropdownOpen={historial.historialDropdownOpen}
          setHistorialDropdownOpen={historial.setHistorialDropdownOpen}
          productoHistorialSeleccionado={historial.productoHistorialSeleccionado}
          ultimoPrecio={historial.ultimoPrecio}
          historial={historial.historial}
        />
      )}

      {activeTab === "importaciones" && (
        <ImportacionesTab
          importProveedorId={importaciones.importProveedorId}
          setImportProveedorId={importaciones.setImportProveedorId}
          proveedores={baseData.proveedores}
          importJson={importaciones.importJson}
          setImportJson={importaciones.setImportJson}
          importarJson={importaciones.importarJson}
          importResult={importaciones.importResult}
        />
      )}

      <ProveedorModal
        proveedorSeleccionado={proveedores.proveedorSeleccionado}
        proveedorEdit={proveedores.proveedorEdit}
        setProveedorEdit={proveedores.setProveedorEdit}
        proveedorEditando={proveedores.proveedorEditando}
        setProveedorEditando={proveedores.setProveedorEditando}
        closeProveedorModal={proveedores.closeProveedorModal}
        cancelProveedorEdit={proveedores.cancelProveedorEdit}
        saveProveedorEdit={proveedores.saveProveedorEdit}
      />

      <ProductoModal
        productoSeleccionado={productos.productoSeleccionado}
        productoEdit={productos.productoEdit}
        setProductoEdit={productos.setProductoEdit}
        productoEditando={productos.productoEditando}
        setProductoEditando={productos.setProductoEditando}
        closeProductoModal={productos.closeProductoModal}
        cancelProductoEdit={productos.cancelProductoEdit}
        saveProductoEdit={productos.saveProductoEdit}
        proveedores={baseData.proveedores}
        categorias={baseData.categorias}
        subcategoriasProductoEdit={productos.subcategoriasProductoEdit}
      />

      <CotizacionModal
        cotizacionSeleccionada={cotizaciones.cotizacionSeleccionada}
        cotizacionEdit={cotizaciones.cotizacionEdit}
        cotizacionEditando={cotizaciones.cotizacionEditando}
        closeCotizacionModal={cotizaciones.closeCotizacionModal}
        updateCotizacionEdit={cotizaciones.updateCotizacionEdit}
        setCotizacionEdit={cotizaciones.setCotizacionEdit}
        itemTotalUsd={cotizaciones.itemTotalUsd}
        cotizacionEditResumen={cotizaciones.cotizacionEditResumen}
        updateCotizacionEditItem={cotizaciones.updateCotizacionEditItem}
        removeCotizacionEditItem={cotizaciones.removeCotizacionEditItem}
        printCotizacion={cotizaciones.printCotizacion}
        cancelCotizacionEdit={cotizaciones.cancelCotizacionEdit}
        saveCotizacionEdit={cotizaciones.saveCotizacionEdit}
        startCotizacionEdit={cotizaciones.editCotizacionInWizard}
        onUpdateStatus={cotizaciones.updateCotizacionStatus}
        updatingStatus={cotizaciones.updatingStatus}
      />
    </main>
  );
}

export default App;
