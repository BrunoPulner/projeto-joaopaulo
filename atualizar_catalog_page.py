from pathlib import Path
import sys
p=Path('src/features/catalog/catalogPage.tsx')
if not p.exists(): sys.exit('Execute este script na raiz do projeto.')
s=p.read_text(encoding='utf-8')
if 'selectedPizzaCustomizations' in s: sys.exit('Personalizações já integradas; nenhuma alteração feita.')
def change(a,b,desc):
 global s
 n=s.count(a)
 if n!=1: sys.exit(f'Não foi possível localizar {desc} (ocorrências: {n}); nada foi alterado.')
 s=s.replace(a,b,1)
change('import { useCart } from "../cart/useCart";', 'import { useCart } from "../cart/useCart";\nimport type { PizzaFlavorCustomization } from "./components/PizzaFlavorDetailsModal";', 'import')
change('  const [pizzaFlavorTotalCents, setPizzaFlavorTotalCents] =\n    useState(0);','  const [pizzaFlavorTotalCents, setPizzaFlavorTotalCents] =\n    useState(0);\n\n  const [selectedPizzaCustomizations, setSelectedPizzaCustomizations] =\n    useState<PizzaFlavorCustomization[]>([]);','estado')
for label in ['reinício','troca de categoria']:
 change('    setSelectedPizzaFlavors([]);\n    setPizzaFlavorTotalCents(0);','    setSelectedPizzaFlavors([]);\n    setSelectedPizzaCustomizations([]);\n    setPizzaFlavorTotalCents(0);',label)
change('    setSelectedPizzaFlavors([]);\n    setSelectedPizzaAddons([]);\n\n    setPizzaFlavorTotalCents(', '    setSelectedPizzaFlavors([]);\n    setSelectedPizzaCustomizations([]);\n    setSelectedPizzaAddons([]);\n\n    setPizzaFlavorTotalCents(', 'tamanho')
change('  function handlePizzaFlavorsContinue(\n    flavors: PizzaCatalogFlavor[],\n    totalPriceCents: number,\n  ) {','  function handlePizzaFlavorsContinue(\n    flavors: PizzaCatalogFlavor[],\n    totalPriceCents: number,\n    customizations: PizzaFlavorCustomization[],\n  ) {','callback')
change('    setSelectedPizzaFlavors(flavors);\n\n    setPizzaFlavorTotalCents(', '    setSelectedPizzaFlavors(flavors);\n    setSelectedPizzaCustomizations(\n      customizations.filter((item) =>\n        flavors.some((flavor) => flavor.id === item.flavorId),\n      ),\n    );\n\n    setPizzaFlavorTotalCents(', 'armazenamento')
old='''                                   </div>
                                 ),
                               )}
                             </div>
                           </div>

                           {/* ADICIONAIS */}'''
new='''                                   </div>
                                 ),
                               )}
                               {selectedPizzaCustomizations
                                 .filter((item) => item.removedIngredients.length > 0)
                                 .map((item) => {
                                   const flavor = selectedPizzaFlavors.find(
                                     (value) => value.id === item.flavorId,
                                   );
                                   if (!flavor) return null;
                                   return (
                                     <div key={`removed-${item.flavorId}`} className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                                       <strong>{flavor.name}:</strong>{" "}
                                       sem {item.removedIngredients.map((ingredient) => ingredient.name).join(", ")}
                                     </div>
                                   );
                                 })}
                             </div>
                           </div>

                           {/* ADICIONAIS */}'''
change(old,new,'resumo')
backup=p.with_suffix('.tsx.bak')
backup.write_text(p.read_text(encoding='utf-8'),encoding='utf-8')
p.write_text(s,encoding='utf-8')
print('CatalogPage atualizado:',p)
print('Backup:',backup)
