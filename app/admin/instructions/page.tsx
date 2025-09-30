"use client";

import { AdminNav } from "@/components/admin/AdminNav";

export const dynamic = 'force-dynamic';

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-4">
          <AdminNav />
          <div>
            <h1 className="text-2xl font-bold tracking-[0.35em] uppercase text-[color:rgb(220,230,255)]">System Instructions</h1>
            <p className="mt-3 text-sm text-neutral-500">Comprehensive fitting system overview and design guidance</p>
          </div>
        </header>

        {/* NEW: Custom Module & Slot Types Section */}
        <section className="space-y-6 text-sm leading-6 bg-blue-950/20 border border-blue-800/50 rounded-lg p-6">
          <h2 className="text-blue-300 font-semibold text-lg">🆕 Custom Module & Slot System</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-white font-semibold">Module Types</h3>
              <p className="text-neutral-300">Beyond the base types (Power, Ammo, Utility), you can now create custom module types like:</p>
              <ul className="list-disc ml-6 text-neutral-400 mt-2">
                <li><span className="text-red-400">Weapon</span> - Specialized offensive modules</li>
                <li><span className="text-cyan-400">Shield</span> - Defensive barrier systems</li>
                <li><span className="text-amber-400">Engine</span> - Propulsion and mobility</li>
                <li><span className="text-teal-400">Sensor</span> - Detection and targeting</li>
                <li>Any custom type you can imagine...</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold">Hybrid Slots</h3>
              <p className="text-neutral-300">Slots can accept multiple module types with bandwidth penalties:</p>
              <ul className="list-disc ml-6 text-neutral-400 mt-2">
                <li><span className="text-purple-400">Hybrid-PA</span> - Accepts Power & Ammo</li>
                <li><span className="text-cyan-400">Hybrid-PU</span> - Accepts Power & Utility</li>
                <li><span className="text-lime-400">Hybrid-AU</span> - Accepts Ammo & Utility</li>
                <li><span className="text-pink-400">Hybrid-PAU</span> - Universal (all types)</li>
                <li>Custom combinations with your own rules...</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold">How It Works</h3>
              <ol className="list-decimal ml-6 text-neutral-300 mt-2 space-y-1">
                <li>Create module types in <span className="text-blue-400">/admin/module-types</span></li>
                <li>Define custom slots in <span className="text-blue-400">/admin/slots</span></li>
                <li>Specify which module types each slot accepts</li>
                <li>Set bandwidth multipliers for non-preferred types</li>
                <li>Create modules with your custom types</li>
              </ol>
            </div>

            <div className="bg-neutral-900/50 rounded p-3 border border-neutral-800">
              <p className="text-xs text-neutral-400">
                <span className="text-yellow-400">Example:</span> A "Weapon" slot that accepts both Weapon and Power modules, 
                but Power modules use 1.3x bandwidth when placed there.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-6 text-sm leading-6">
          <div>
            <h2 className="text-white font-semibold">If primaries are the verb…</h2>
            <p className="text-neutral-300">They define what your ship does on the battlefield.</p>
            <p className="text-neutral-400 italic">"I shoot," "I heal," "I mine," "I jam," "I drone."</p>
            <p className="text-neutral-300">Big, identity-defining actions.</p>
          </div>

          <div>
            <h2 className="text-white font-semibold">…then secondaries are the adjectives/adverbs…</h2>
            <p className="text-neutral-300">They describe how your ship does it in a given fight.</p>
            <ul className="text-neutral-400 italic list-disc ml-6">
              <li>"I shoot, but I can also ram."</li>
              <li>"I mine, but I can also jam a scout."</li>
            </ul>
            <p className="text-neutral-300">Tactical, situational color.</p>
          </div>

          <div>
            <h2 className="text-white font-semibold">…and universals are the grammar.</h2>
            <p className="text-neutral-300">They define the tone, efficiency, and constraints of that action.</p>
            <p className="text-neutral-300">Universals don't change what you do, they shape the quality, rhythm, and emphasis.</p>
            <ul className="text-neutral-400 italic list-disc ml-6">
              <li>"I shoot faster."</li>
              <li>"I mine quieter."</li>
              <li>"I heat slower."</li>
              <li>"I drift less."</li>
            </ul>
          </div>
        </section>

        {/* Soft Archetype System */}
        <section className="space-y-6 text-sm leading-6 border-t border-neutral-800 pt-6">
          <h2 className="text-white font-semibold">Soft Archetype System</h2>
          <p className="text-neutral-300">Archetypes guide, they do not gate. Hulls advertise tags they handle well, and modules/primaries carry tags. Matching tags grant efficiency and stability; mismatches still work but create bandwidth pressure and handling penalties.</p>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-2">Support</div>
              <p className="text-neutral-300">Signal augmentation, comms, repair. Slot bias to Utility, central Power spine. Synergy with tags: support, signal, precision.</p>
            </div>
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-2">Defender</div>
              <p className="text-neutral-300">Shielding, triage, counter-fire. Contiguous Utility clusters, generous bandwidth, high Power capacity.</p>
            </div>
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-2">Assault</div>
              <p className="text-neutral-300">Close to mid-range bruiser. Heavy Power spine, tight bandwidth to force trade-offs. Likes mobility kits.</p>
            </div>
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-2">Artillery</div>
              <p className="text-neutral-300">Long-range pressure and burst. Alternating Ammo/Power lanes, minimal Utility. High bandwidth but low mobility.</p>
            </div>
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-2">Recon</div>
              <p className="text-neutral-300">Precision strikes, scouting, counter-stealth. Balanced slots with prow/stern Utility. Higher evasion, moderate bandwidth.</p>
            </div>
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-2">Infiltrator</div>
              <p className="text-neutral-300">ECM, signature suppression, sabotage. Utility heavy edges, scattered Power. Lower bandwidth cap, modest Power capacity.</p>
            </div>
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-2">Carrier</div>
              <p className="text-neutral-300">Drone operations, distributed fire control. Utility dominates stern/midline; Ammo blocks for depots. Highest bandwidth.</p>
            </div>
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-2">Bulwark</div>
              <p className="text-neutral-300">Attrition tanking, area denial. Dense Power+Utility core with Ammo outboard. Very high bandwidth with built-in mismatch friction.</p>
            </div>
          </div>
        </section>

        {/* Designer Handbook */}
        <section className="space-y-6 text-sm leading-6 border-t border-neutral-800 pt-6">
          <h2 className="text-white font-semibold">Fitting, from a Designer's Perspective</h2>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.35em] text-neutral-500">How the picker decides what to show</h3>
            <ul className="list-disc ml-6 text-neutral-300">
              <li><span className="text-white">Power budget:</span> primary + chosen secondaries must fit the hull's Power Capacity.</li>
              <li><span className="text-white">Slot skeleton:</span> the hull's Power/Ammo/Utility counts must satisfy the primary's minima after secondary deltas.</li>
              <li><span className="text-white">Tags:</span> hull incompatible tags hide choices; compatible tags are preferred so the list stays readable.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.35em] text-neutral-500">Bandwidth & placement</h3>
            <p className="text-neutral-300">Universals add bandwidth (BW). If a module covers cells whose slot doesn't match its own, BW cost rises. Over BW Limit never blocks the build — it just makes the ship feel heavier (lower responsiveness).</p>
            <div className="text-[11px] text-neutral-400 mt-2">
              <div>BW effective ≈ baseBW × (1 + mismatchPenalty) × (1 − synergyRebate)</div>
              <div className="mt-1">Where mismatchPenalty comes from covered cells whose slot differs from the module slot, and synergyRebate comes from tags that match the hull focus.</div>
            </div>
          </div>

          {/* Drawings: grid & shape templates */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-[0.35em] text-neutral-500">Shape Templates</h3>
            <p className="text-neutral-400">Use these canonical footprints for universals. Bars for rails/masts, blocks for heavy frames, L‑shapes for wing/edge gear.</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {/* S1 */}
              <div>
                <div className="text-neutral-300 mb-2">S1 — 1×1</div>
                <div className="inline-grid grid-cols-3 gap-[2px] p-2 rounded border border-neutral-800 bg-neutral-950">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`w-6 h-6 border ${i===4?'bg-blue-600/40 border-blue-500':'bg-neutral-900 border-neutral-800'}`} />
                  ))}
                </div>
              </div>

              {/* S2 */}
              <div>
                <div className="text-neutral-300 mb-2">S2 — 1×2 bar</div>
                <div className="inline-grid grid-cols-3 gap-[2px] p-2 rounded border border-neutral-800 bg-neutral-950">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`w-6 h-6 border ${[4,5].includes(i)?'bg-blue-600/40 border-blue-500':'bg-neutral-900 border-neutral-800'}`} />
                  ))}
                </div>
              </div>

              {/* S3 bar */}
              <div>
                <div className="text-neutral-300 mb-2">S3 — 1×3 bar</div>
                <div className="inline-grid grid-cols-3 gap-[2px] p-2 rounded border border-neutral-800 bg-neutral-950">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`w-6 h-6 border ${[3,4,5].includes(i)?'bg-blue-600/40 border-blue-500':'bg-neutral-900 border-neutral-800'}`} />
                  ))}
                </div>
              </div>

              {/* S3 L */}
              <div>
                <div className="text-neutral-300 mb-2">S3 — L triomino</div>
                <div className="inline-grid grid-cols-3 gap-[2px] p-2 rounded border border-neutral-800 bg-neutral-950">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`w-6 h-6 border ${[4,7,8].includes(i)?'bg-blue-600/40 border-blue-500':'bg-neutral-900 border-neutral-800'}`} />
                  ))}
                </div>
              </div>

              {/* M2 */}
              <div>
                <div className="text-neutral-300 mb-2">M2 — 2×2 block</div>
                <div className="inline-grid grid-cols-3 gap-[2px] p-2 rounded border border-neutral-800 bg-neutral-950">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`w-6 h-6 border ${[0,1,3,4].includes(i)?'bg-blue-600/40 border-blue-500':'bg-neutral-900 border-neutral-800'}`} />
                  ))}
                </div>
              </div>

              {/* MT */}
              <div>
                <div className="text-neutral-300 mb-2">MT — 2×3 block</div>
                <div className="inline-grid grid-cols-3 gap-[2px] p-2 rounded border border-neutral-800 bg-neutral-950">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`w-6 h-6 border ${[0,1,2,3,4,5].includes(i)?'bg-blue-600/40 border-blue-500':'bg-neutral-900 border-neutral-800'}`} />
                  ))}
                </div>
              </div>

              {/* SL */}
              <div>
                <div className="text-neutral-300 mb-2">SL — 2×2 locked</div>
                <div className="inline-grid grid-cols-3 gap-[2px] p-2 rounded border border-neutral-800 bg-neutral-950">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className={`w-6 h-6 border ${[4,5,7,8].includes(i)?'bg-blue-600/40 border-blue-500':'bg-neutral-900 border-neutral-800'}`} />
                  ))}
                </div>
                <div className="text-[11px] text-neutral-500 mt-1">Rotation locked (anchored)</div>
              </div>
            </div>
          </div>

          {/* Slot legend and sample hull grid */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.35em] text-neutral-500">Slot Legend</h3>
            <div className="flex flex-wrap gap-3 text-[11px] text-neutral-300">
              <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-blue-600/40 border border-blue-500" /> Power</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-orange-600/40 border border-orange-500" /> Ammo</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-green-600/40 border border-green-500" /> Utility</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-purple-600/40 border border-purple-500" /> Hybrid-PA</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-cyan-600/40 border border-cyan-500" /> Hybrid-PU</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-pink-600/40 border border-pink-500" /> Universal</span>
            </div>

            <div className="mt-2 inline-grid grid-cols-8 gap-[2px] p-2 rounded border border-neutral-800 bg-neutral-950">
              {Array.from({ length: 48 }).map((_, i) => {
                // illustrative distribution: mix of P/A/U blocks
                const p = [2,3,10,11,18,19,26,27];
                const a = [5,6,13,14,21,22,29,30];
                const isP = p.includes(i);
                const isA = a.includes(i);
                return (
                  <div
                    key={i}
                    className={`w-5 h-5 border ${isP ? 'bg-blue-600/40 border-blue-500' : isA ? 'bg-orange-600/40 border-orange-500' : 'bg-green-600/40 border-green-500'}`}
                    title={isP ? 'Power' : isA ? 'Ammo' : 'Utility'}
                  />
                );
              })}
            </div>
          </div>

          {/* Why things appear or are hidden */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.35em] text-neutral-500">Why you sometimes do not see an item</h3>
            <ul className="list-disc ml-6 text-neutral-300">
              <li>Primary asks for more minimum slots than the hull has after secondary deltas.</li>
              <li>Power draw would exceed capacity; we hide extreme outliers to avoid noise.</li>
              <li>Hull has incompatible tags for that item and we are prioritizing readability.</li>
              <li>Variant resolution prunes size‑inappropriate options for your hull size.</li>
              <li><span className="text-yellow-400">NEW:</span> Module type doesn't match any slot types the hull provides.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.35em] text-neutral-500">Designer's checklist</h3>
            <ul className="list-disc ml-6 text-neutral-300">
              <li>Hulls: bias slot density to the role; give holes to force interesting placement.</li>
              <li>Primaries: keep 2–3 headline stats and a clear power/slot ask; tag the role.</li>
              <li>Secondaries: make effects short and tactical; only add ΔP/A/U when you want grid pressure.</li>
              <li>Universals: small, literal stat bumps; shapes and BW are the real constraints.</li>
              <li>Over BW should feel deliberate, not accidental; reward matching slots with cheaper BW.</li>
              <li><span className="text-yellow-400">NEW:</span> Create specialized module types for unique systems (weapons, engines, shields).</li>
              <li><span className="text-yellow-400">NEW:</span> Use hybrid slots strategically to allow flexibility at a bandwidth cost.</li>
            </ul>
          </div>
        </section>

        {/* Authoring Notes */}
        <section className="space-y-6 text-sm leading-6 border-t border-neutral-800 pt-6">
          <h2 className="text-white font-semibold">Authoring Notes & Data Mapping</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-1">Primaries</div>
              <ul className="list-disc ml-6 text-neutral-300">
                <li>Use metadata: range (optimal/falloff/radius), tempo (rof, burst, reload), resources (power, BW, heat).</li>
                <li>Give one archetype focus tag to drive synergy.</li>
                <li>Ammo variants can adjust damage, range, status; keep to 2–3 clear choices.</li>
              </ul>
            </div>
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-1">Secondaries</div>
              <ul className="list-disc ml-6 text-neutral-300">
                <li>Short duration tactical effects; avoid passive always‑on.</li>
                <li>Use ΔP/A/U to push grid trade‑offs, not to lock content.</li>
                <li>Tag for role so hull synergies can rebate BW or add stability.</li>
              </ul>
            </div>
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-1">Universals</div>
              <ul className="list-disc ml-6 text-neutral-300">
                <li>Choose a template shape (S1, S2, S3, M2, MT, SL) and derive baseBW from footprint complexity.</li>
                <li>Map effects to concrete stats: rofBonus, trackingBonus, emissions_pct, powerGen, armor, shieldStrength, etc.</li>
                <li>Prefer small, explicit numbers over vague copy; stack to feel.</li>
                <li><span className="text-yellow-400">NEW:</span> Assign custom module types for specialized systems.</li>
              </ul>
            </div>
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-1">Custom Types</div>
              <ul className="list-disc ml-6 text-neutral-300">
                <li><span className="text-yellow-400">NEW:</span> Define module types beyond Power/Ammo/Utility.</li>
                <li><span className="text-yellow-400">NEW:</span> Create hybrid slots that accept multiple types.</li>
                <li><span className="text-yellow-400">NEW:</span> Set bandwidth multipliers for type mismatches.</li>
                <li><span className="text-yellow-400">NEW:</span> Use colors and categories to organize modules.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}