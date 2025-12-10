import React, { useState } from 'react';
import { AppConfig } from '../types';

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // NUEVOS ENCABEZADOS SOLICITADOS
  const HEADERS = "Codigo, Marca, Repuesto, Precio, Stok, Imagen";

  const GAS_CODE = `function doGet(e) {
  // 1. Conexión con la hoja
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // MODIFICADO: Busca específicamente la hoja llamada "bat rep"
  var sheet = ss.getSheetByName("bat rep");
  
  // Validación de seguridad por si el nombre está mal escrito en el Sheet
  if (!sheet) {
     return ContentService.createTextOutput(JSON.stringify([{
       id: "ERR",
       name: "ERROR CRÍTICO: No se encontró la hoja 'bat rep'. Revisa el nombre en tu Excel.",
       price: 0,
       stock: 0,
       compatibleModels: [],
       imageUrl: "",
       category: "Error"
     }])).setMimeType(ContentService.MimeType.JSON);
  }

  var data = sheet.getDataRange().getValues();
  
  // Asumimos que la fila 1 son encabezados
  var rows = data.slice(1);

  // 2. Mapeo de Columnas (NUEVA ESTRUCTURA)
  // 0:Codigo, 1:Marca, 2:Repuesto, 3:Precio, 4:Stok, 5:Imagen
  var products = rows.filter(function(row) { return row[0] !== "" }).map(function(row) {
    return {
      id: String(row[0]),
      // "Marca" se usa como modelos compatibles para la búsqueda
      compatibleModels: String(row[1]).split(',').map(function(s) { return s.trim(); }), 
      name: String(row[2]), // "Repuesto" es el nombre
      category: "General",  // Categoría por defecto (ya que no hay columna)
      price: Number(row[3]),
      stock: Number(row[4]),
      imageUrl: String(row[5]),
      description: String(row[2]) + " para " + String(row[1]) // Descripción auto-generada
    };
  });

  // 3. Filtrado según parámetros de la URL (Inteligencia Artificial)
  var p = e.parameter;

  // Filtrar por nombre del repuesto
  if (p.part) {
    var term = p.part.toLowerCase();
    products = products.filter(function(item) { 
      return item.name.toLowerCase().includes(term);
    });
  }

  // Filtrar por Marca (busca en la columna Marca)
  if (p.make) {
    var make = p.make.toLowerCase();
    products = products.filter(function(item) { 
      return item.compatibleModels.some(function(m) { return m.toLowerCase().includes(make); });
    });
  }
  
  // Filtrar por Modelo (si la IA detecta modelo, buscamos en Marca o Nombre)
  if (p.model) {
    var model = p.model.toLowerCase();
    products = products.filter(function(item) { 
       var inName = item.name.toLowerCase().includes(model);
       var inMake = item.compatibleModels.some(function(m) { return m.toLowerCase().includes(model); });
       return inName || inMake;
    });
  }

  // 4. Devolver JSON
  return ContentService.createTextOutput(JSON.stringify(products))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const generateMagicLink = () => {
    // Encode config to Base64
    const jsonStr = JSON.stringify(localConfig);
    const encoded = btoa(jsonStr);
    const url = `${window.location.origin}${window.location.pathname}?cfg=${encoded}`;
    
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl w-full max-w-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-xl font-bold text-white flex items-center">
            Configuración del Sistema
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-blue-300">URL de Google Apps Script</label>
                <input 
                  type="text" 
                  value={localConfig.appsScriptUrl}
                  onChange={(e) => setLocalConfig({...localConfig, appsScriptUrl: e.target.value})}
                  placeholder="https://script.google.com/macros/s/..."
                  className="w-full bg-black/50 border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder-slate-600 font-mono text-sm"
                />
             </div>

             <div className="space-y-2">
                <label className="block text-sm font-medium text-purple-300">Google Gemini API Key</label>
                <input 
                  type="password" 
                  value={localConfig.googleApiKey}
                  onChange={(e) => setLocalConfig({...localConfig, googleApiKey: e.target.value})}
                  placeholder="AIzaSy..."
                  className="w-full bg-black/50 border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                />
             </div>

             <div className="space-y-2">
                <label className="block text-sm font-medium text-green-300">WhatsApp (Ventas)</label>
                <input 
                  type="text" 
                  value={localConfig.whatsappNumber}
                  onChange={(e) => setLocalConfig({...localConfig, whatsappNumber: e.target.value})}
                  placeholder="54911..."
                  className="w-full bg-black/50 border border-slate-600 rounded-xl p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                />
             </div>
          </div>
          
           <div className="flex items-center space-x-2 pt-2 border-t border-white/5">
             <input 
                type="checkbox" 
                id="mockData"
                checked={localConfig.useMockData} 
                onChange={(e) => setLocalConfig({...localConfig, useMockData: e.target.checked})}
                className="rounded bg-slate-800 border-slate-600 text-blue-600 focus:ring-blue-500"
             />
             <label htmlFor="mockData" className="text-sm text-slate-400">Usar datos de prueba (Modo Demo)</label>
           </div>

           {/* Magic Link Generator */}
           <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 p-4 rounded-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm">
                <p className="text-white font-semibold">🔗 Link Mágico de Acceso</p>
                <p className="text-slate-400 text-xs mt-1">
                  Genera una URL que incluye tu <strong className="text-purple-300">API Key</strong>, <strong className="text-green-300">WhatsApp</strong> y <strong className="text-blue-300">Script URL</strong> para no tener que escribirlos de nuevo.
                </p>
              </div>
              <button 
                onClick={generateMagicLink}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center ${copiedLink ? 'bg-green-500 text-white' : 'bg-white/10 hover:bg-white/20 text-blue-300 border border-white/10'}`}
              >
                {copiedLink ? (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    Copiar Magic Link
                  </>
                )}
              </button>
           </div>

           {/* Toggle Guide */}
           <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <button 
                onClick={() => setShowGuide(!showGuide)}
                className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors text-left"
              >
                 <span className="text-blue-300 font-semibold flex items-center">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                   📑 Ver Código y Guía de Instalación
                 </span>
                 <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-slate-400 transform transition-transform ${showGuide ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showGuide && (
                <div className="p-4 border-t border-white/10 bg-black/20 text-sm space-y-4 animate-fadeIn">
                   <div>
                     <p className="text-white font-bold mb-1">1. Prepara tu Google Sheet</p>
                     <p className="text-slate-400 mb-2">La primera fila DEBE tener estos encabezados exactos:</p>
                     <div className="bg-slate-800 p-2 rounded text-xs font-mono text-green-400 overflow-x-auto select-all">
                       {HEADERS}
                     </div>
                     <p className="text-slate-400 mb-2 mt-2">La hoja DEBE llamarse: <strong className="text-white">bat rep</strong></p>
                   </div>

                   <div>
                     <p className="text-white font-bold mb-1">2. Instala el Código</p>
                     <p className="text-slate-400 mb-2">Ve a <strong>Extensiones &gt; Apps Script</strong> y pega esto (reemplaza lo anterior):</p>
                     <div className="relative group">
                        <button 
                          onClick={() => navigator.clipboard.writeText(GAS_CODE)}
                          className="absolute right-2 top-2 bg-blue-600 hover:bg-blue-500 text-white text-[10px] px-2 py-1 rounded transition-colors"
                        >
                          Copiar
                        </button>
                        <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-blue-300 h-48 overflow-y-auto custom-scrollbar border border-white/5">
                          {GAS_CODE}
                        </pre>
                     </div>
                   </div>

                   <div>
                     <p className="text-white font-bold mb-1">3. Publicar (Importante)</p>
                     <ul className="list-disc list-inside text-slate-400 text-xs space-y-1">
                       <li>Haz clic en <strong>Implementar &gt; Nueva implementación</strong>.</li>
                       <li>Selecciona el tipo: <strong>Aplicación web</strong>.</li>
                       <li>Ejecutar como: <strong>Yo</strong>.</li>
                       <li>Quién tiene acceso: <strong>Cualquier usuario</strong>.</li>
                       <li>Copia la URL resultante y pégala arriba.</li>
                     </ul>
                   </div>
                </div>
              )}
           </div>

        </div>

        <div className="p-5 border-t border-white/10 bg-black/20 flex justify-end">
          <button 
            onClick={() => onSave(localConfig)}
            className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-8 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-900/20 transform active:scale-95"
          >
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
};