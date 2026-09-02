// import { useEffect, useState, useRef } from "react";
// import {
//   Plus,
//   Search,
//   Package,
//   Pencil,
//   Trash2,
//   ArrowUpCircle,
//   Upload,
//   X,
//   Image as ImageIcon,
// } from "lucide-react";
// import { useAuth } from "@/contexts/AuthContext";
// import { db } from "@/db/database";
// import { supabase } from "@/lib/supabase";
// import Header from "@/components/layout/Header";
// import Button from "@/components/ui/Button";
// import Input from "@/components/ui/Input";
// import Modal from "@/components/ui/Modal";
// import Badge from "@/components/ui/Badge";
// import Select from "@/components/ui/Select";
// import { useToast } from "@/components/ui/Toast";
// import { syncRecord } from "@/lib/sync";
// import { generateId, formatCurrency } from "@/utils/helpers";
// import type { Product, Category, StockMovement } from "@/types";

// interface ProductForm {
//   name: string;
//   sku: string;
//   barcode: string;
//   categoryId: string;
//   price: string;
//   costPrice: string;
//   image?: string;
//   stock: string;
//   lowStockAlert: string;
//   unit: string;
//   trackStock: boolean;
//   isActive: boolean;
//   description: string;
// }

// const defaultForm: ProductForm = {
//   name: "",
//   sku: "",
//   barcode: "",
//   categoryId: "",
//   price: "",
//   costPrice: "",
//   stock: "0",
//   lowStockAlert: "5",
//   unit: "pcs",
//   trackStock: true,
//   isActive: true,
//   description: "",
//   image: "",
// };

// export default function InventoryPage() {
//   const { outletSession } = useAuth();
//   const outlet = outletSession!.outlet;
//   const isManager = outletSession?.staff?.role === "manager";

//   const { success, error: showError } = useToast();
//   const [products, setProducts] = useState<Product[]>([]);
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [search, setSearch] = useState("");
//   const [filterCat, setFilterCat] = useState("");
//   const [showModal, setShowModal] = useState(false);
//   const [editingProduct, setEditingProduct] = useState<Product | null>(null);
//   const [showStockModal, setShowStockModal] = useState<Product | null>(null);
//   const [stockAdj, setStockAdj] = useState({
//     type: "in" as "in" | "out" | "adjust",
//     qty: "",
//     note: "",
//   });
//   const [form, setForm] = useState<ProductForm>(defaultForm);
//   const [saving, setSaving] = useState(false);
//   const [showCatModal, setShowCatModal] = useState(false);
//   const [newCatName, setNewCatName] = useState("");

//   // Image upload states
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [imagePreview, setImagePreview] = useState<string | null>(null);
//   const [uploadingImage, setUploadingImage] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const load = async () => {
//     const [prods, cats] = await Promise.all([
//       db.products.where("outletId").equals(outlet.id).toArray(),
//       db.categories.where("outletId").equals(outlet.id).toArray(),
//     ]);
//     setProducts(prods);
//     setCategories(cats);
//   };

//   useEffect(() => {
//     load();
//   }, [outlet.id]);

//   const filtered = products.filter((p) => {
//     const q = search.toLowerCase();
//     const matchSearch =
//       !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
//     const matchCat = !filterCat || p.categoryId === filterCat;
//     return matchSearch && matchCat;
//   });

//   const resetImageState = () => {
//     setImageFile(null);
//     setImagePreview(null);
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const openCreate = () => {
//     if (!isManager) {
//       showError("Only managers can add products.");
//       return;
//     }
//     setEditingProduct(null);
//     setForm(defaultForm);
//     resetImageState();
//     setShowModal(true);
//   };

//   const openEdit = (p: Product) => {
//     if (!isManager) {
//       showError("Only managers can edit products.");
//       return;
//     }
//     setEditingProduct(p);
//     setForm({
//       name: p.name,
//       sku: p.sku,
//       barcode: p.barcode ?? "",
//       categoryId: p.categoryId ?? "",
//       price: p.price.toString(),
//       costPrice: p.costPrice.toString(),
//       stock: p.stock.toString(),
//       lowStockAlert: p.lowStockAlert.toString(),
//       unit: p.unit,
//       trackStock: p.trackStock,
//       isActive: p.isActive,
//       description: p.description ?? "",
//       image: p.image ?? "",
//     });
//     setImageFile(null);
//     setImagePreview(p.image || null);
//     setShowModal(true);
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!file.type.startsWith("image/")) {
//       showError("Please upload a valid image file (PNG, JPG, WebP).");
//       return;
//     }

//     if (file.size > 2 * 1024 * 1024) {
//       showError("Image size must be less than 2MB.");
//       return;
//     }

//     setImageFile(file);
//     setImagePreview(URL.createObjectURL(file));
//   };

//   const removeImage = () => {
//     resetImageState();
//     setForm((prev) => ({ ...prev, image: "" }));
//   };

//   const uploadProductImage = async (
//     productId: string,
//   ): Promise<string | null> => {
//     if (!imageFile) return form.image || null;

//     setUploadingImage(true);
//     try {
//       const fileExt = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
//       const filePath = `${outlet.id}/${productId}-${Date.now()}.${fileExt}`;

//       const { data, error } = await supabase.storage
//         .from("product-images")
//         .upload(filePath, imageFile, {
//           cacheControl: "3600",
//           upsert: true,
//         });

//       if (error) throw error;

//       const { data: publicUrlData } = supabase.storage
//         .from("product-images")
//         .getPublicUrl(data.path);

//       return publicUrlData.publicUrl;
//     } catch (err: any) {
//       showError(`Image upload failed: ${err.message}`);
//       return null;
//     } finally {
//       setUploadingImage(false);
//     }
//   };

//   const handleSave = async () => {
//     if (!isManager) {
//       showError("Only managers can add or edit products.");
//       return;
//     }

//     if (!form.name || !form.sku || !form.price) {
//       showError("Name, SKU and price are required.");
//       return;
//     }

//     const existing = products.find(
//       (p) => p.sku === form.sku && p.id !== editingProduct?.id,
//     );
//     if (existing) {
//       showError("A product with this SKU already exists.");
//       return;
//     }

//     setSaving(true);
//     try {
//       const productId = editingProduct ? editingProduct.id : generateId();

//       let finalImageUrl = form.image;
//       if (imageFile) {
//         const uploadedUrl = await uploadProductImage(productId);
//         if (uploadedUrl) finalImageUrl = uploadedUrl;
//       }

//       const now = new Date().toISOString();
//       const data = {
//         name: form.name,
//         sku: form.sku,
//         barcode: form.barcode,
//         categoryId: form.categoryId || undefined,
//         price: parseFloat(form.price),
//         costPrice: parseFloat(form.costPrice || "0"),
//         stock: parseInt(form.stock || "0"),
//         lowStockAlert: parseInt(form.lowStockAlert || "5"),
//         unit: form.unit,
//         trackStock: form.trackStock,
//         isActive: form.isActive,
//         description: form.description,
//         image: finalImageUrl || undefined,
//         updatedAt: now,
//         syncStatus: "pending" as const,
//       };

//       if (editingProduct) {
//         await db.products.update(editingProduct.id, data);
//         const updatedProduct = await db.products.get(editingProduct.id);
//         if (updatedProduct) await syncRecord("products", updatedProduct);
//         success("Product updated.");
//       } else {
//         const product = {
//           id: productId,
//           outletId: outlet.id,
//           createdAt: now,
//           ...data,
//         };
//         await db.products.add(product);
//         await syncRecord("products", product);
//         success("Product added.");
//       }

//       setShowModal(false);
//       resetImageState();
//       load();
//     } catch (err: any) {
//       showError(err.message);
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleStockAdj = async () => {
//     if (!showStockModal || !stockAdj.qty) return;
//     const qty = parseInt(stockAdj.qty);
//     if (isNaN(qty) || qty <= 0) {
//       showError("Enter a valid quantity.");
//       return;
//     }
//     const product = showStockModal;
//     const now = new Date().toISOString();
//     let newStock = product.stock;
//     if (stockAdj.type === "in") newStock += qty;
//     else if (stockAdj.type === "out") newStock = Math.max(0, newStock - qty);
//     else newStock = qty;

//     await db.products.update(product.id, {
//       stock: newStock,
//       updatedAt: now,
//       syncStatus: "pending",
//     });
//     const updatedProduct = await db.products.get(product.id);
//     if (updatedProduct) await syncRecord("products", updatedProduct);

//     const movement: StockMovement = {
//       id: generateId(),
//       outletId: outlet.id,
//       productId: product.id,
//       productName: product.name,
//       type: stockAdj.type,
//       qty: stockAdj.type === "out" ? -qty : qty,
//       prevStock: product.stock,
//       newStock,
//       note: stockAdj.note,
//       createdAt: now,
//       syncStatus: "pending",
//     };
//     await db.stockMovements.add(movement);
//     await syncRecord("stockMovements", movement);
//     success("Stock adjusted.");
//     setShowStockModal(null);
//     setStockAdj({ type: "in", qty: "", note: "" });
//     load();
//   };

//   const deleteProduct = async (p: Product) => {
//     if (!isManager) {
//       showError("Only managers can delete products.");
//       return;
//     }
//     if (!confirm(`Delete "${p.name}"?`)) return;
//     await db.products.delete(p.id);
//     success("Product deleted.");
//     load();
//   };

//   const addCategory = async () => {
//     if (!newCatName.trim()) return;
//     const category = {
//       id: generateId(),
//       outletId: outlet.id,
//       name: newCatName.trim(),
//       createdAt: new Date().toISOString(),
//       syncStatus: "pending" as const,
//     };
//     await db.categories.add(category);
//     await syncRecord("categories", category);
//     setNewCatName("");
//     setShowCatModal(false);
//     load();
//     success("Category added.");
//   };

//   return (
//     <div>
//       <Header
//         title="Inventory"
//         subtitle={`${products.length} products`}
//         actions={
//           <div className="flex gap-2">
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => setShowCatModal(true)}
//             >
//               Categories
//             </Button>
//             {isManager && (
//               <Button icon={<Plus size={16} />} size="sm" onClick={openCreate}>
//                 Add Product
//               </Button>
//             )}
//           </div>
//         }
//       />
//       <div className="p-6 space-y-4">
//         <div className="flex flex-col sm:flex-row gap-3">
//           <Input
//             placeholder="Search products..."
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//             leftIcon={<Search size={15} />}
//             className="max-w-xs"
//           />
//           <select
//             value={filterCat}
//             onChange={(e) => setFilterCat(e.target.value)}
//             className="bg-pos-input border border-pos-border rounded-lg px-3 py-2 text-sm text-pos-text focus:outline-none focus:border-blue-500"
//           >
//             <option value="">All Categories</option>
//             {categories.map((c) => (
//               <option key={c.id} value={c.id}>
//                 {c.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         {filtered.length === 0 ? (
//           <div className="flex flex-col items-center justify-center py-24 text-center">
//             <Package size={48} className="text-pos-muted mb-4 opacity-40" />
//             <h3 className="text-pos-text font-semibold mb-2">
//               No products found
//             </h3>
//             {isManager && (
//               <Button icon={<Plus size={16} />} onClick={openCreate}>
//                 Add First Product
//               </Button>
//             )}
//           </div>
//         ) : (
//           <div className="bg-pos-card border border-pos-border rounded-xl overflow-x-auto">
//             <table className="w-full min-w-200 text-sm">
//               <thead>
//                 <tr className="border-b border-pos-border">
//                   {[
//                     "Product",
//                     "SKU",
//                     "Category",
//                     "Price",
//                     "Cost",
//                     "Stock",
//                     "Status",
//                     "",
//                   ].map((h) => (
//                     <th
//                       key={h}
//                       className="text-left px-4 py-3 text-xs font-medium text-pos-muted uppercase tracking-wider"
//                     >
//                       {h}
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-pos-border">
//                 {filtered.map((p) => {
//                   const cat = categories.find((c) => c.id === p.categoryId);
//                   const isLow = p.trackStock && p.stock <= p.lowStockAlert;
//                   return (
//                     <tr
//                       key={p.id}
//                       className="hover:bg-pos-hover transition-colors"
//                     >
//                       <td className="px-4 py-3">
//                         <div className="flex items-center gap-3">
//                           {p.image ? (
//                             <img
//                               src={p.image}
//                               alt={p.name}
//                               className="w-10 h-10 object-cover rounded-lg border border-pos-border bg-pos-bg shrink-0"
//                             />
//                           ) : (
//                             <div className="w-10 h-10 rounded-lg border border-pos-border bg-pos-bg flex items-center justify-center text-pos-muted shrink-0">
//                               <ImageIcon size={18} />
//                             </div>
//                           )}
//                           <div>
//                             <p className="font-medium text-pos-text">
//                               {p.name}
//                             </p>
//                             {p.description && (
//                               <p className="text-xs text-pos-muted truncate max-w-45">
//                                 {p.description}
//                               </p>
//                             )}
//                           </div>
//                         </div>
//                       </td>
//                       <td className="px-4 py-3 text-pos-muted font-mono text-xs">
//                         {p.sku}
//                       </td>
//                       <td className="px-4 py-3 text-pos-muted">
//                         {cat?.name ?? "—"}
//                       </td>
//                       <td className="px-4 py-3 font-semibold text-pos-text">
//                         {formatCurrency(p.price)}
//                       </td>
//                       <td className="px-4 py-3 text-pos-muted">
//                         {formatCurrency(p.costPrice)}
//                       </td>
//                       <td className="px-4 py-3">
//                         <span
//                           className={
//                             isLow
//                               ? "text-amber-400 font-medium"
//                               : "text-pos-text"
//                           }
//                         >
//                           {p.trackStock ? `${p.stock} ${p.unit}` : "∞"}
//                         </span>
//                       </td>
//                       <td className="px-4 py-3">
//                         <Badge
//                           variant={
//                             p.isActive
//                               ? isLow
//                                 ? "warning"
//                                 : "success"
//                               : "muted"
//                           }
//                           dot
//                         >
//                           {!p.isActive
//                             ? "Inactive"
//                             : isLow
//                               ? "Low Stock"
//                               : "In Stock"}
//                         </Badge>
//                       </td>
//                       <td className="px-4 py-3">
//                         <div className="flex gap-1 justify-end">
//                           <button
//                             onClick={() => setShowStockModal(p)}
//                             className="p-1.5 rounded-lg text-pos-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
//                             title="Adjust stock"
//                           >
//                             <ArrowUpCircle size={15} />
//                           </button>
//                           {isManager && (
//                             <>
//                               <button
//                                 onClick={() => openEdit(p)}
//                                 className="p-1.5 rounded-lg text-pos-muted hover:text-pos-text hover:bg-pos-hover transition-colors"
//                                 title="Edit product"
//                               >
//                                 <Pencil size={15} />
//                               </button>
//                               <button
//                                 onClick={() => deleteProduct(p)}
//                                 className="p-1.5 rounded-lg text-pos-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
//                                 title="Delete product"
//                               >
//                                 <Trash2 size={15} />
//                               </button>
//                             </>
//                           )}
//                         </div>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       <Modal
//         open={showModal}
//         onClose={() => setShowModal(false)}
//         title={editingProduct ? "Edit Product" : "Add Product"}
//         size="lg"
//         footer={
//           <div className="flex gap-3 justify-end">
//             <Button variant="outline" onClick={() => setShowModal(false)}>
//               Cancel
//             </Button>
//             <Button onClick={handleSave} loading={saving || uploadingImage}>
//               Save Product
//             </Button>
//           </div>
//         }
//       >
//         <div className="space-y-4">
//           <div>
//             <label className="block text-xs font-medium text-pos-muted mb-1.5">
//               Product Image (Optional)
//             </label>
//             <div className="flex items-center gap-4">
//               {imagePreview ? (
//                 <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-pos-border bg-pos-bg shrink-0 group">
//                   <img
//                     src={imagePreview}
//                     alt="Preview"
//                     className="w-full h-full object-cover"
//                   />
//                   <button
//                     type="button"
//                     onClick={removeImage}
//                     className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
//                     title="Remove Image"
//                   >
//                     <X size={12} />
//                   </button>
//                 </div>
//               ) : (
//                 <div
//                   onClick={() => fileInputRef.current?.click()}
//                   className="w-20 h-20 rounded-lg border-2 border-dashed border-pos-border hover:border-blue-500/50 bg-pos-bg flex flex-col items-center justify-center text-pos-muted cursor-pointer transition-colors shrink-0"
//                 >
//                   <Upload size={18} className="mb-1" />
//                   <span className="text-[10px]">Upload</span>
//                 </div>
//               )}
//               <div className="text-xs text-pos-muted space-y-1">
//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   accept="image/png, image/jpeg, image/webp"
//                   onChange={handleImageChange}
//                   className="hidden"
//                 />
//                 <Button
//                   type="button"
//                   variant="outline"
//                   size="sm"
//                   onClick={() => fileInputRef.current?.click()}
//                 >
//                   {imagePreview ? "Change Image" : "Choose File"}
//                 </Button>
//                 <p className="text-[11px] opacity-70">
//                   PNG, JPG, or WEBP up to 2MB.
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <Input
//               label="Product Name"
//               placeholder="Rice (50kg)"
//               value={form.name}
//               onChange={(e) => setForm({ ...form, name: e.target.value })}
//               required
//             />
//             <Input
//               label="SKU"
//               placeholder="RICE-50KG"
//               value={form.sku}
//               onChange={(e) =>
//                 setForm({ ...form, sku: e.target.value.toUpperCase() })
//               }
//               required
//             />
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <Input
//               label="Barcode (optional)"
//               placeholder="1234567890"
//               value={form.barcode}
//               onChange={(e) => setForm({ ...form, barcode: e.target.value })}
//             />
//             <Select
//               label="Category"
//               value={form.categoryId}
//               onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
//               options={categories.map((c) => ({ value: c.id, label: c.name }))}
//               placeholder="Select category"
//             />
//           </div>
//           <div className="grid grid-cols-2 gap-4">
//             <Input
//               label="Selling Price (₦)"
//               type="number"
//               min="0"
//               placeholder="2500"
//               value={form.price}
//               onChange={(e) => setForm({ ...form, price: e.target.value })}
//               required
//             />
//             <Input
//               label="Cost Price (₦)"
//               type="number"
//               min="0"
//               placeholder="2000"
//               value={form.costPrice}
//               onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
//             />
//           </div>
//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//             <Input
//               label="Unit"
//               placeholder="pcs, kg, bag"
//               value={form.unit}
//               onChange={(e) => setForm({ ...form, unit: e.target.value })}
//             />
//             <Input
//               label="Opening Stock"
//               type="number"
//               min="0"
//               value={form.stock}
//               onChange={(e) => setForm({ ...form, stock: e.target.value })}
//             />
//             <Input
//               label="Low Stock Alert"
//               type="number"
//               min="0"
//               value={form.lowStockAlert}
//               onChange={(e) =>
//                 setForm({ ...form, lowStockAlert: e.target.value })
//               }
//             />
//           </div>
//           <Input
//             label="Description (optional)"
//             value={form.description}
//             onChange={(e) => setForm({ ...form, description: e.target.value })}
//           />
//           <div className="flex gap-6">
//             <label className="flex items-center gap-2 cursor-pointer text-sm text-pos-text">
//               <input
//                 type="checkbox"
//                 checked={form.trackStock}
//                 onChange={(e) =>
//                   setForm({ ...form, trackStock: e.target.checked })
//                 }
//                 className="accent-blue-500"
//               />
//               Track stock
//             </label>
//             <label className="flex items-center gap-2 cursor-pointer text-sm text-pos-text">
//               <input
//                 type="checkbox"
//                 checked={form.isActive}
//                 onChange={(e) =>
//                   setForm({ ...form, isActive: e.target.checked })
//                 }
//                 className="accent-blue-500"
//               />
//               Active (visible in POS)
//             </label>
//           </div>
//         </div>
//       </Modal>

//       <Modal
//         open={!!showStockModal}
//         onClose={() => setShowStockModal(null)}
//         title={`Adjust Stock — ${showStockModal?.name}`}
//         size="sm"
//         footer={
//           <div className="flex gap-3 justify-end">
//             <Button variant="outline" onClick={() => setShowStockModal(null)}>
//               Cancel
//             </Button>
//             <Button onClick={handleStockAdj}>Apply</Button>
//           </div>
//         }
//       >
//         <div className="space-y-4">
//           <p className="text-sm text-pos-muted">
//             Current stock:{" "}
//             <span className="text-pos-text font-semibold">
//               {showStockModal?.stock} {showStockModal?.unit}
//             </span>
//           </p>
//           <Select
//             label="Movement Type"
//             value={stockAdj.type}
//             onChange={(e) =>
//               setStockAdj({ ...stockAdj, type: e.target.value as any })
//             }
//             options={[
//               { value: "in", label: "Stock In (Receive)" },
//               { value: "out", label: "Stock Out (Remove)" },
//               { value: "adjust", label: "Set Exact Quantity" },
//             ]}
//           />
//           <Input
//             label={stockAdj.type === "adjust" ? "New Quantity" : "Quantity"}
//             type="number"
//             min="1"
//             placeholder="0"
//             value={stockAdj.qty}
//             onChange={(e) => setStockAdj({ ...stockAdj, qty: e.target.value })}
//           />
//           <Input
//             label="Note (optional)"
//             placeholder="Purchase from supplier, wastage..."
//             value={stockAdj.note}
//             onChange={(e) => setStockAdj({ ...stockAdj, note: e.target.value })}
//           />
//         </div>
//       </Modal>

//       <Modal
//         open={showCatModal}
//         onClose={() => setShowCatModal(false)}
//         title="Manage Categories"
//         size="sm"
//       >
//         <div className="space-y-4">
//           <div className="flex gap-2">
//             <Input
//               placeholder="Category name"
//               value={newCatName}
//               onChange={(e) => setNewCatName(e.target.value)}
//               className="flex-1"
//             />
//             <Button onClick={addCategory}>Add</Button>
//           </div>
//           <div className="space-y-2 max-h-48 overflow-y-auto">
//             {categories.map((c) => (
//               <div
//                 key={c.id}
//                 className="flex items-center justify-between px-3 py-2 bg-pos-bg rounded-lg"
//               >
//                 <span className="text-sm text-pos-text">{c.name}</span>
//                 <button
//                   onClick={async () => {
//                     await db.categories.delete(c.id);
//                     load();
//                   }}
//                   className="text-pos-muted hover:text-red-400 transition-colors"
//                 >
//                   <Trash2 size={14} />
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// }

import { useEffect, useState, useRef } from "react";
import {
  Plus,
  Search,
  Package,
  Pencil,
  Trash2,
  ArrowUpCircle,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/db/database";
import { getSupabaseConfigStatus, supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { recordAuditLog, syncRecord } from "@/lib/sync";
import { generateId, formatCurrency } from "@/utils/helpers";
import type { Product, Category, StockMovement } from "@/types";

interface ProductForm {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  price: string;
  costPrice: string;
  image?: string;
  stock: string;
  lowStockAlert: string;
  unit: string;
  trackStock: boolean;
  isActive: boolean;
  description: string;
}

const defaultForm: ProductForm = {
  name: "",
  sku: "",
  barcode: "",
  categoryId: "",
  price: "",
  costPrice: "",
  stock: "0",
  lowStockAlert: "5",
  unit: "pcs",
  trackStock: true,
  isActive: true,
  description: "",
  image: "",
};

export default function InventoryPage() {
  const { outletSession } = useAuth();
  const outlet = outletSession!.outlet;
  const outletCurrency = outlet.currency ?? "NGN";
  const isManager = outletSession?.staff?.role === "manager";

  const { success, error: showError } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showStockModal, setShowStockModal] = useState<Product | null>(null);
  const [stockAdj, setStockAdj] = useState({
    type: "in" as "in" | "out" | "adjust",
    qty: "",
    note: "",
  });
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");

  // Image upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    const [prods, cats] = await Promise.all([
      db.products.where("outletId").equals(outlet.id).toArray(),
      db.categories.where("outletId").equals(outlet.id).toArray(),
    ]);
    setProducts(prods);
    setCategories(cats);
  };

  useEffect(() => {
    load();
  }, [outlet.id]);

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCat = !filterCat || p.categoryId === filterCat;
    return matchSearch && matchCat;
  });

  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    if (!isManager) {
      showError("Only managers can add products.");
      return;
    }
    setEditingProduct(null);
    setForm(defaultForm);
    resetImageState();
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    if (!isManager) {
      showError("Only managers can edit products.");
      return;
    }
    setEditingProduct(p);
    setForm({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode ?? "",
      categoryId: p.categoryId ?? "",
      price: p.price.toString(),
      costPrice: p.costPrice.toString(),
      stock: p.stock.toString(),
      lowStockAlert: p.lowStockAlert.toString(),
      unit: p.unit,
      trackStock: p.trackStock,
      isActive: p.isActive,
      description: p.description ?? "",
      image: p.image ?? "",
    });
    setImageFile(null);
    setImagePreview(p.image || null);
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showError("Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showError("Image size must be less than 2MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    resetImageState();
    setForm((prev) => ({ ...prev, image: "" }));
  };

  const uploadProductImage = async (
    productId: string,
  ): Promise<string | null> => {
    if (!imageFile) return form.image || null;

    setUploadingImage(true);
    try {
      const fileExt = imageFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${outlet.id}/${productId}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(filePath, imageFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err: any) {
      showError(`Image upload failed: ${err.message}`);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!isManager) {
      showError("Only managers can add or edit products.");
      return;
    }

    if (!form.name || !form.sku || !form.price) {
      showError("Name, SKU and price are required.");
      return;
    }

    const existing = products.find(
      (p) => p.sku === form.sku && p.id !== editingProduct?.id,
    );
    if (existing) {
      showError("A product with this SKU already exists.");
      return;
    }

    setSaving(true);
    try {
      const productId = editingProduct ? editingProduct.id : generateId();

      let finalImageUrl = form.image;
      if (imageFile) {
        const uploadedUrl = await uploadProductImage(productId);
        if (uploadedUrl) finalImageUrl = uploadedUrl;
      }

      const now = new Date().toISOString();
      const data = {
        name: form.name,
        sku: form.sku,
        barcode: form.barcode,
        categoryId: form.categoryId || undefined,
        price: parseFloat(form.price),
        costPrice: parseFloat(form.costPrice || "0"),
        stock: parseInt(form.stock || "0"),
        lowStockAlert: parseInt(form.lowStockAlert || "5"),
        unit: form.unit,
        trackStock: form.trackStock,
        isActive: form.isActive,
        description: form.description,
        image: finalImageUrl || undefined,
        updatedAt: now,
        syncStatus: "pending" as const,
      };

      if (editingProduct) {
        await db.products.update(editingProduct.id, data);
        const updatedProduct = await db.products.get(editingProduct.id);
        if (updatedProduct) await syncRecord("products", updatedProduct);
        await recordAuditLog({
          id: generateId(),
          outletId: outlet.id,
          action: "product_edited",
          actorId: outletSession?.staff?.id,
          actorName: outletSession?.staff?.name ?? "Unknown",
          actorRole: outletSession?.staff?.role,
          productId: editingProduct.id,
          productName: data.name,
          details: `SKU ${data.sku}`,
          createdAt: now,
          syncStatus: "pending",
        });
        success("Product updated.");
      } else {
        const product = {
          id: productId,
          outletId: outlet.id,
          createdAt: now,
          ...data,
        };
        await db.products.add(product);
        await syncRecord("products", product);
        await recordAuditLog({
          id: generateId(),
          outletId: outlet.id,
          action: "product_added",
          actorId: outletSession?.staff?.id,
          actorName: outletSession?.staff?.name ?? "Unknown",
          actorRole: outletSession?.staff?.role,
          productId: product.id,
          productName: product.name,
          details: `SKU ${product.sku}`,
          createdAt: now,
          syncStatus: "pending",
        });
        success("Product added.");
      }

      setShowModal(false);
      resetImageState();
      load();
    } catch (err: any) {
      showError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleStockAdj = async () => {
    if (!isManager) {
      showError("Only managers can adjust stock.");
      return;
    }
    if (!showStockModal || !stockAdj.qty) return;
    const qty = parseInt(stockAdj.qty);
    if (isNaN(qty) || qty <= 0) {
      showError("Enter a valid quantity.");
      return;
    }
    const product = showStockModal;
    const now = new Date().toISOString();
    let newStock = product.stock;
    if (stockAdj.type === "in") newStock += qty;
    else if (stockAdj.type === "out") newStock = Math.max(0, newStock - qty);
    else newStock = qty;

    await db.products.update(product.id, {
      stock: newStock,
      updatedAt: now,
      syncStatus: "pending",
    });
    const updatedProduct = await db.products.get(product.id);
    if (updatedProduct) await syncRecord("products", updatedProduct);

    const movement: StockMovement = {
      id: generateId(),
      outletId: outlet.id,
      productId: product.id,
      productName: product.name,
      type: stockAdj.type,
      qty: stockAdj.type === "out" ? -qty : qty,
      prevStock: product.stock,
      newStock,
      note: stockAdj.note,
      createdAt: now,
      syncStatus: "pending",
    };
    await db.stockMovements.add(movement);
    await syncRecord("stockMovements", movement);
    success("Stock adjusted.");
    setShowStockModal(null);
    setStockAdj({ type: "in", qty: "", note: "" });
    load();
  };

  const deleteProduct = async (p: Product) => {
    if (!isManager) {
      showError("Only managers can delete products.");
      return;
    }
    if (!confirm(`Delete "${p.name}"?`)) return;
    try {
      const { isConfigured } = getSupabaseConfigStatus();
      if (isConfigured) {
        const result = await syncRecord("products", p.id, "delete");
        if (!result.ok) {
          throw new Error("The product could not be deleted from Supabase.");
        }
      }

      await db.products.delete(p.id);
      await recordAuditLog({
        id: generateId(),
        outletId: outlet.id,
        action: "product_deleted",
        actorId: outletSession?.staff?.id,
        actorName: outletSession?.staff?.name ?? "Unknown",
        actorRole: outletSession?.staff?.role,
        productId: p.id,
        productName: p.name,
        details: `SKU ${p.sku}`,
        createdAt: new Date().toISOString(),
        syncStatus: "pending",
      });
      success("Product deleted from the outlet and Supabase.");
      await load();
    } catch (err: any) {
      showError(err.message ?? "Product deletion failed. No data was removed.");
    }
  };

  const addCategory = async () => {
    if (!isManager) {
      showError("Only managers can add categories.");
      return;
    }
    if (!newCatName.trim()) return;
    const category = {
      id: generateId(),
      outletId: outlet.id,
      name: newCatName.trim(),
      createdAt: new Date().toISOString(),
      syncStatus: "pending" as const,
    };
    await db.categories.add(category);
    await syncRecord("categories", category);
    setNewCatName("");
    setShowCatModal(false);
    load();
    success("Category added.");
  };

  const deleteCategory = async (catId: string) => {
    if (!isManager) {
      showError("Only managers can delete categories.");
      return;
    }
    await db.categories.delete(catId);
    load();
    success("Category deleted.");
  };

  return (
    <div>
      <Header
        title="Inventory"
        subtitle={`${products.length} products`}
        actions={
          <div className="flex gap-2">
            {isManager && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCatModal(true)}
                >
                  Categories
                </Button>
                <Button
                  icon={<Plus size={16} />}
                  size="sm"
                  onClick={openCreate}
                >
                  Add Product
                </Button>
              </>
            )}
          </div>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={15} />}
            className="max-w-xs"
          />
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="bg-pos-input border border-pos-border rounded-lg px-3 py-2 text-sm text-pos-text focus:outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Package size={48} className="text-pos-muted mb-4 opacity-40" />
            <h3 className="text-pos-text font-semibold mb-2">
              No products found
            </h3>
            {isManager && (
              <Button icon={<Plus size={16} />} onClick={openCreate}>
                Add First Product
              </Button>
            )}
          </div>
        ) : (
          <div className="bg-pos-card border border-pos-border rounded-xl overflow-x-auto">
            <table className="w-full min-w-200 text-sm">
              <thead>
                <tr className="border-b border-pos-border">
                  {[
                    "Product",
                    "SKU",
                    "Category",
                    "Price",
                    "Cost",
                    "Stock",
                    "Status",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-pos-muted uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-pos-border">
                {filtered.map((p) => {
                  const cat = categories.find((c) => c.id === p.categoryId);
                  const isLow = p.trackStock && p.stock <= p.lowStockAlert;
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-pos-hover transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 object-cover rounded-lg border border-pos-border bg-pos-bg shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-pos-border bg-pos-bg flex items-center justify-center text-pos-muted shrink-0">
                              <ImageIcon size={18} />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-pos-text">
                              {p.name}
                            </p>
                            {p.description && (
                              <p className="text-xs text-pos-muted truncate max-w-45">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-pos-muted font-mono text-xs">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3 text-pos-muted">
                        {cat?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-semibold text-pos-text">
                        {formatCurrency(p.price, outletCurrency)}
                      </td>
                      <td className="px-4 py-3 text-pos-muted">
                        {formatCurrency(p.costPrice, outletCurrency)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            isLow
                              ? "text-amber-400 font-medium"
                              : "text-pos-text"
                          }
                        >
                          {p.trackStock ? `${p.stock} ${p.unit}` : "∞"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            p.isActive
                              ? isLow
                                ? "warning"
                                : "success"
                              : "muted"
                          }
                          dot
                        >
                          {!p.isActive
                            ? "Inactive"
                            : isLow
                              ? "Low Stock"
                              : "In Stock"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          {isManager && (
                            <>
                              <button
                                onClick={() => setShowStockModal(p)}
                                className="p-1.5 rounded-lg text-pos-muted hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                                title="Adjust stock"
                              >
                                <ArrowUpCircle size={15} />
                              </button>
                              <button
                                onClick={() => openEdit(p)}
                                className="p-1.5 rounded-lg text-pos-muted hover:text-pos-text hover:bg-pos-hover transition-colors"
                                title="Edit product"
                              >
                                <Pencil size={15} />
                              </button>
                              <button
                                onClick={() => deleteProduct(p)}
                                className="p-1.5 rounded-lg text-pos-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                title="Delete product"
                              >
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingProduct ? "Edit Product" : "Add Product"}
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving || uploadingImage}>
              Save Product
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-pos-muted mb-1.5">
              Product Image (Optional)
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-pos-border bg-pos-bg shrink-0 group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-red-500 transition-colors"
                    title="Remove Image"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-pos-border hover:border-blue-500/50 bg-pos-bg flex flex-col items-center justify-center text-pos-muted cursor-pointer transition-colors shrink-0"
                >
                  <Upload size={18} className="mb-1" />
                  <span className="text-[10px]">Upload</span>
                </div>
              )}
              <div className="text-xs text-pos-muted space-y-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imagePreview ? "Change Image" : "Choose File"}
                </Button>
                <p className="text-[11px] opacity-70">
                  PNG, JPG, or WEBP up to 2MB.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Name"
              placeholder="Rice (50kg)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="SKU"
              placeholder="RICE-50KG"
              value={form.sku}
              onChange={(e) =>
                setForm({ ...form, sku: e.target.value.toUpperCase() })
              }
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Barcode (optional)"
              placeholder="1234567890"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
            />
            <Select
              label="Category"
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Selling Price (₦)"
              type="number"
              min="0"
              placeholder="2500"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
            <Input
              label="Cost Price (₦)"
              type="number"
              min="0"
              placeholder="2000"
              value={form.costPrice}
              onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Unit"
              placeholder="pcs, kg, bag"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
            <Input
              label="Opening Stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
            />
            <Input
              label="Low Stock Alert"
              type="number"
              min="0"
              value={form.lowStockAlert}
              onChange={(e) =>
                setForm({ ...form, lowStockAlert: e.target.value })
              }
            />
          </div>
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-pos-text">
              <input
                type="checkbox"
                checked={form.trackStock}
                onChange={(e) =>
                  setForm({ ...form, trackStock: e.target.checked })
                }
                className="accent-blue-500"
              />
              Track stock
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-pos-text">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="accent-blue-500"
              />
              Active (visible in POS)
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!showStockModal}
        onClose={() => setShowStockModal(null)}
        title={`Adjust Stock — ${showStockModal?.name}`}
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={() => setShowStockModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleStockAdj}>Apply</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-pos-muted">
            Current stock:{" "}
            <span className="text-pos-text font-semibold">
              {showStockModal?.stock} {showStockModal?.unit}
            </span>
          </p>
          <Select
            label="Movement Type"
            value={stockAdj.type}
            onChange={(e) =>
              setStockAdj({ ...stockAdj, type: e.target.value as any })
            }
            options={[
              { value: "in", label: "Stock In (Receive)" },
              { value: "out", label: "Stock Out (Remove)" },
              { value: "adjust", label: "Set Exact Quantity" },
            ]}
          />
          <Input
            label={stockAdj.type === "adjust" ? "New Quantity" : "Quantity"}
            type="number"
            min="1"
            placeholder="0"
            value={stockAdj.qty}
            onChange={(e) => setStockAdj({ ...stockAdj, qty: e.target.value })}
          />
          <Input
            label="Note (optional)"
            placeholder="Purchase from supplier, wastage..."
            value={stockAdj.note}
            onChange={(e) => setStockAdj({ ...stockAdj, note: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={showCatModal}
        onClose={() => setShowCatModal(false)}
        title="Manage Categories"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Category name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={addCategory}>Add</Button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between px-3 py-2 bg-pos-bg rounded-lg"
              >
                <span className="text-sm text-pos-text">{c.name}</span>
                <button
                  onClick={() => deleteCategory(c.id)}
                  className="text-pos-muted hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
