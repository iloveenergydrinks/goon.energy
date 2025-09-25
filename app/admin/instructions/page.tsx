export const dynamic = 'force-dynamic';

export default function InstructionsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-[0.35em] uppercase text-[color:rgb(220,230,255)]">System Instructions</h1>
          <p className="mt-3 text-sm text-neutral-500">Soft archetype fitting overview and design guidance</p>
        </header>

        <section className="space-y-6 text-sm leading-6">
          <div>
            <h2 className="text-white font-semibold">If primaries are the verb…</h2>
            <p className="text-neutral-300">They define what your ship does on the battlefield.</p>
            <p className="text-neutral-400 italic">“I shoot,” “I heal,” “I mine,” “I jam,” “I drone.”</p>
            <p className="text-neutral-300">Big, identity-defining actions.</p>
          </div>

          <div>
            <h2 className="text-white font-semibold">…then secondaries are the adjectives/adverbs…</h2>
            <p className="text-neutral-300">They describe how your ship does it in a given fight.</p>
            <ul className="text-neutral-400 italic list-disc ml-6">
              <li>“I shoot, but I can also ram.”</li>
              <li>“I mine, but I can also jam a scout.”</li>
            </ul>
            <p className="text-neutral-300">Tactical, situational color.</p>
          </div>

          <div>
            <h2 className="text-white font-semibold">…and universals are the grammar.</h2>
            <p className="text-neutral-300">They define the tone, efficiency, and constraints of that action.</p>
            <p className="text-neutral-300">Universals don’t change what you do, they shape the quality, rhythm, and emphasis.</p>
            <ul className="text-neutral-400 italic list-disc ml-6">
              <li>“I shoot faster.”</li>
              <li>“I mine quieter.”</li>
              <li>“I heat slower.”</li>
              <li>“I drift less.”</li>
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
          <h2 className="text-white font-semibold">Fitting, from a Designer’s Perspective</h2>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.35em] text-neutral-500">How the picker decides what to show</h3>
            <ul className="list-disc ml-6 text-neutral-300">
              <li><span className="text-white">Power budget:</span> primary + chosen secondaries must fit the hull’s Power Capacity.</li>
              <li><span className="text-white">Slot skeleton:</span> the hull’s Power/Ammo/Utility counts must satisfy the primary’s minima after secondary deltas.</li>
              <li><span className="text-white">Tags:</span> hull incompatible tags hide choices; compatible tags are preferred so the list stays readable.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.35em] text-neutral-500">Bandwidth & placement</h3>
            <p className="text-neutral-300">Universals add bandwidth (BW). If a module covers cells whose slot doesn’t match its own, BW cost rises. Over BW Limit never blocks the build — it just makes the ship feel heavier (lower responsiveness).</p>
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
            <div className="flex items-center gap-3 text-[11px] text-neutral-300">
              <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-[color:rgb(60,60,60)] border border-neutral-700" /> Power</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-[color:rgb(30,30,30)] border border-neutral-700" /> Ammo</span>
              <span className="inline-flex items-center gap-1"><span className="inline-block w-4 h-4 rounded-sm bg-[color:rgb(18,18,18)] border border-neutral-700" /> Utility</span>
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
                    className={`w-5 h-5 border ${isP ? 'bg-[color:rgb(60,60,60)] border-neutral-700' : isA ? 'bg-[color:rgb(30,30,30)] border-neutral-800' : 'bg-[color:rgb(18,18,18)] border-neutral-900'}`}
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
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs uppercase tracking-[0.35em] text-neutral-500">Designer’s checklist</h3>
            <ul className="list-disc ml-6 text-neutral-300">
              <li>Hulls: bias slot density to the role; give holes to force interesting placement.</li>
              <li>Primaries: keep 2–3 headline stats and a clear power/slot ask; tag the role.</li>
              <li>Secondaries: make effects short and tactical; only add ΔP/A/U when you want grid pressure.</li>
              <li>Universals: small, literal stat bumps; shapes and BW are the real constraints.</li>
              <li>Over BW should feel deliberate, not accidental; reward matching slots with cheaper BW.</li>
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
              </ul>
            </div>
            <div className="border border-neutral-800 rounded p-3 bg-neutral-900/40">
              <div className="text-xs uppercase tracking-[0.35em] text-neutral-500 mb-1">Variants</div>
              <ul className="list-disc ml-6 text-neutral-300">
                <li>Resolve module tier by hull size. Smaller hulls pick lighter variants by default.</li>
                <li>Use diminishing stacking for repeated identical bonuses to prevent runaway effects.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}


