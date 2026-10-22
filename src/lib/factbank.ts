// Compact concept-fact bank used by the offline DEMO generator to build
// genuinely varied objective questions. Each fact is a true statement about
// one concept. Format: "Concept — statement".

export const FACT_BANK: Record<string, string[]> = {
  // ---------------- Physics ----------------
  "Electric Charges and Fields": [
    "Coulomb's law — The force between two point charges is directly proportional to the product of charges and inversely proportional to the square of the separation.",
    "Electric field — The electric field due to a point charge falls off as the inverse square of the distance.",
    "Electric dipole — The electric field on the equatorial line of a dipole is antiparallel to the dipole moment.",
    "Gauss's law — Electric flux through a closed surface depends only on the enclosed charge, not on the surface shape.",
    "Electric flux — Electric flux through a surface is the surface integral of the electric field normal to it.",
  ],
  "Electrostatic Potential and Capacitance": [
    "Equipotential surfaces — Equipotential surfaces are always perpendicular to electric field lines.",
    "Capacitance — The capacitance of a parallel plate capacitor is directly proportional to plate area and inversely proportional to separation.",
    "Dielectrics — Inserting a dielectric increases the capacitance of a capacitor by the dielectric constant factor.",
    "Energy stored in a capacitor — Energy stored in a capacitor equals half CV squared.",
    "Potential due to a dipole — Potential due to an electric dipole on its axial line falls off as inverse cube of distance.",
  ],
  "Current Electricity": [
    "Ohm's law — At constant temperature, current through a conductor is directly proportional to the potential difference.",
    "Drift velocity — Drift velocity of free electrons is directly proportional to the electric field inside the conductor.",
    "Kirchhoff's junction rule — The sum of currents meeting at a junction is zero, based on charge conservation.",
    "Wheatstone bridge — A Wheatstone bridge is balanced when the ratio of arms is equal and galvanometer current is zero.",
    "Potentiometer — A potentiometer measures potential difference more accurately than a voltmeter because no current flows at balance.",
  ],
  "Moving Charges and Magnetism": [
    "Biot–Savart law — The magnetic field due to a current element varies inversely as the square of the distance.",
    "Ampere's circuital law — The line integral of magnetic field around a closed loop equals mu naught times the enclosed current.",
    "Solenoid — A solenoid produces a uniform magnetic field inside, similar to a bar magnet.",
    "Cyclotron — A cyclotron uses an alternating electric field and a static magnetic field to accelerate charged particles.",
    "Lorentz force — A charge moving parallel to a magnetic field experiences no magnetic force.",
  ],
  "Magnetism and Matter": [
    "Bar magnet — A bar magnet is equivalent to a solenoid carrying steady current.",
    "Magnetic susceptibility — For a diamagnetic substance, magnetic susceptibility is negative and small.",
    "Hysteresis — Hysteresis loop area represents energy dissipated per unit volume per cycle.",
    "Earth's magnetism — Earth's magnetic field resembles that of a dipole tilted about eleven degrees from the rotation axis.",
    "Paramagnetism — Paramagnetic substances are weakly attracted by external magnetic fields.",
  ],
  "Electromagnetic Induction": [
    "Faraday's law — The induced emf in a coil equals the negative rate of change of magnetic flux through it.",
    "Lenz's law — Induced current opposes the change in magnetic flux that produced it, conserving energy.",
    "Motional emf — Motional emf across a rod moving in a magnetic field is Blv.",
    "Eddy currents — Laminated cores reduce energy loss due to eddy currents.",
    "Self-inductance — Self-inductance of a coil opposes any change in current through it.",
  ],
  "Alternating Current": [
    "LCR resonance — At resonance in an LCR circuit, impedance is minimum and current is maximum.",
    "Power factor — Power factor of an AC circuit is the cosine of the phase angle between voltage and current.",
    "Transformer — A transformer works on mutual induction and changes AC voltage levels.",
    "RMS value — The RMS value of AC is that steady DC which produces the same heating effect in a resistor.",
    "Resonant frequency — Resonant frequency of an LCR circuit is one over two pi root LC.",
  ],
  "Electromagnetic Waves": [
    "Displacement current — Displacement current arises from changing electric flux and completes Ampere's law for capacitors.",
    "EM wave properties — In an electromagnetic wave, electric and magnetic fields are perpendicular to each other and to the direction of propagation.",
    "Speed of light — Electromagnetic waves travel in vacuum at about three into ten to the eight metres per second.",
    "Electromagnetic spectrum — Gamma rays have the shortest wavelength in the electromagnetic spectrum.",
    "Transverse nature — Electromagnetic waves are transverse in nature and can be polarised.",
  ],
  "Ray Optics and Optical Instruments": [
    "Snell's law — Refractive index equals sine of angle of incidence over sine of angle of refraction.",
    "Total internal reflection — Total internal reflection occurs when light travels from a denser to a rarer medium beyond the critical angle.",
    "Lens maker's formula — The lens maker's formula relates focal length to refractive index and radii of curvature.",
    "Magnifying power — The magnifying power of a simple microscope equals one plus D by f.",
    "Dispersion — Dispersion occurs because refractive index varies with wavelength of light.",
  ],
  "Wave Optics": [
    "Young's double slit — In YDSE, fringe width is directly proportional to wavelength and slit separation ratio.",
    "Huygens principle — Huygens principle treats every point on a wavefront as a source of secondary wavelets.",
    "Diffraction — Diffraction is the bending of light around the edges of an obstacle or aperture.",
    "Polarisation — Polarisation proves that light is a transverse wave.",
    "Brewster's law — At Brewster's angle, reflected and refracted rays are perpendicular to each other.",
  ],
  "Dual Nature of Radiation and Matter": [
    "Photoelectric effect — In the photoelectric effect, kinetic energy of emitted electrons depends on frequency, not intensity.",
    "Einstein's photoelectric equation — Einstein's equation is kinetic energy maximum equals h nu minus work function.",
    "Photon — A photon is a packet of light energy with momentum h by lambda.",
    "de Broglie relation — de Broglie wavelength of a particle equals Planck's constant divided by its momentum.",
    "Threshold frequency — Below the threshold frequency, no photoelectrons are emitted regardless of intensity.",
  ],
  "Atoms": [
    "Rutherford model — Rutherford's gold foil experiment established that most of the atom is empty space with a tiny dense nucleus.",
    "Bohr model — In Bohr's model, electrons revolve in stationary orbits without radiating energy.",
    "Hydrogen spectrum — The spectral lines of hydrogen correspond to electron transitions between energy levels.",
    "Ionisation energy — Ionisation energy of hydrogen is thirteen point six electron volts.",
    "Energy levels — Energy of the nth orbit of hydrogen varies as one over n squared.",
  ],
  "Nuclei": [
    "Nuclear density — Nuclear density is nearly the same for all nuclei, independent of mass number.",
    "Binding energy — Binding energy per nucleon is maximum around mass number fifty-six, near iron.",
    "Alpha decay — In alpha decay, the nucleus emits a helium nucleus and atomic number decreases by two.",
    "Half-life — Half-life of a radioactive substance is the time in which half the nuclei decay.",
    "Mass-energy relation — Mass defect in a nucleus is converted into nuclear binding energy via E equals mc squared.",
  ],
  "Semiconductor Electronics": [
    "p-n junction — A p-n junction diode conducts current easily in forward bias.",
    "Zener diode — A Zener diode is operated in reverse breakdown region to regulate voltage.",
    "Logic gates — A NAND gate is a universal gate because any logic circuit can be built from it.",
    "Rectifier — A full-wave rectifier converts both halves of an AC cycle into DC.",
    "Intrinsic semiconductor — Pure silicon at room temperature has equal numbers of electrons and holes.",
  ],

  // ---------------- Chemistry ----------------
  Solutions: [
    "Raoult's law — For a solution of volatile liquids, the partial vapour pressure of each component is proportional to its mole fraction.",
    "Henry's law — The solubility of a gas in a liquid is directly proportional to the partial pressure of the gas.",
    "Azeotropes — An azeotrope boils at a constant temperature and has a uniform composition throughout.",
    "Colligative properties — Colligative properties depend on the number of solute particles, not their identity.",
    "Osmotic pressure — Osmotic pressure of a solution is proportional to molar concentration at fixed temperature.",
  ],
  Electrochemistry: [
    "Nernst equation — The Nernst equation relates cell potential to standard potential and reaction quotient.",
    "Galvanic cell — In a galvanic cell, oxidation occurs at the anode and reduction at the cathode.",
    "Faraday's laws — The mass deposited during electrolysis is proportional to the charge passed.",
    "Conductance — Molar conductivity increases with decrease in concentration for a strong electrolyte.",
    "Corrosion — Corrosion is an electrochemical process in which metal is oxidised by its environment.",
  ],
  "Chemical Kinetics": [
    "Order of reaction — Order of a reaction is determined experimentally and need not equal molecularity.",
    "Half-life — Half-life of a first-order reaction is constant and independent of initial concentration.",
    "Rate law — Rate law expresses reaction rate as a product of rate constant and concentration terms raised to orders.",
    "Activation energy — Catalysts increase reaction rate by lowering the activation energy.",
    "Arrhenius equation — The Arrhenius equation shows the rate constant increases exponentially with temperature.",
  ],
  "The d- and f-Block Elements": [
    "Variable oxidation states — Transition elements exhibit variable oxidation states due to involvement of (n-1)d electrons.",
    "Lanthanoids — Lanthanoid contraction makes the atomic and ionic radii of later lanthanoids nearly equal.",
    "Interstitial compounds — Transition metals form interstitial compounds with small atoms like hydrogen, carbon and nitrogen.",
    "Catalytic properties — Many transition metals and their compounds act as good catalysts due to variable oxidation states.",
    "Colour — Colour in transition metal ions arises from d-d transitions.",
  ],
  "Coordination Compounds": [
    "Werner's theory — Werner explained coordination compounds using primary and secondary valencies.",
    "Crystal field theory — Crystal field theory explains colour and magnetic properties of complexes via d-orbital splitting.",
    "Isomerism — Coordination compounds show geometrical and optical isomerism.",
    "EAN rule — The effective atomic number rule predicts stability of carbonyl complexes.",
    "Chelate effect — Polydentate ligands form more stable complexes than comparable monodentate ligands.",
  ],
  "Haloalkanes and Haloarenes": [
    "C–X bond — The carbon-halogen bond in haloalkanes is polar, making carbon electrophilic.",
    "SN2 mechanism — SN2 reaction proceeds with inversion of configuration in a single step.",
    "SN1 mechanism — SN1 reaction proceeds via a carbocation intermediate and racemisation.",
    "Optical rotation — Chiral haloalkanes rotate the plane of polarised light.",
    "Grignard reagent — Haloalkanes react with magnesium in dry ether to form Grignard reagents.",
  ],
  "Alcohols, Phenols and Ethers": [
    "Phenol acidity — Phenol is more acidic than aliphatic alcohols due to resonance stabilisation of phenoxide.",
    "Williamson synthesis — Williamson synthesis prepares ethers via SN2 attack of alkoxide on alkyl halide.",
    "Reimer-Tiemann reaction — Reimer-Tiemann reaction introduces a salicylaldehyde group into phenol.",
    "Lucas test — Lucas reagent distinguishes primary, secondary and tertiary alcohols by turbidity rate.",
    "Dehydration — Alcohol dehydration to an alkene follows the Saytzeff rule of greater substitution.",
  ],
  "Aldehydes, Ketones and Carboxylic Acids": [
    "Nucleophilic addition — Aldehydes are more reactive than ketones towards nucleophilic addition due to steric and electronic effects.",
    "Aldol condensation — Aldol condensation requires alpha-hydrogen and forms a beta-hydroxy carbonyl product.",
    "Cannizzaro reaction — Cannizzaro reaction occurs in aldehydes lacking alpha-hydrogen under strong base.",
    "Tollens' reagent — Tollens' reagent distinguishes aldehydes from ketones by giving a silver mirror with aldehydes.",
    "Carboxylic acidity — Carboxylic acids are more acidic than phenols due to equivalent resonance structures of carboxylate.",
  ],
  Amines: [
    "Basicity — In aqueous phase, secondary amines are generally more basic than primary and tertiary amines.",
    "Carbylamine reaction — Primary amines give the foul-smelling carbylamine test with chloroform and alkali.",
    "Diazonium salts — Aryl diazonium salts are useful intermediates for azo coupling reactions.",
    "Hinsberg reaction — Hinsberg reagent distinguishes primary, secondary and tertiary amines.",
    "Amide reduction — Amides can be reduced to amines using lithium aluminium hydride.",
  ],
  Biomolecules: [
    "Proteins — Proteins are polymers of amino acids linked by peptide bonds.",
    "Enzymes — Enzymes are biocatalysts with high specificity that lower activation energy.",
    "DNA — DNA is a polymer of deoxyribonucleotides with A-T and G-C complementary base pairing.",
    "Carbohydrates — Carbohydrates are polyhydroxy aldehydes or ketones or their derivatives.",
    "Vitamins — Vitamins are organic compounds required in small amounts that cannot be synthesised by the body.",
  ],

  // ---------------- Mathematics ----------------
  "Relations and Functions": [
    "Equivalence relation — A relation that is reflexive, symmetric and transitive is an equivalence relation.",
    "Invertible function — A function is invertible if and only if it is bijective.",
    "Composition — The composition of two functions is not commutative in general.",
    "One-one function — A function is one-one if distinct elements of the domain have distinct images.",
    "Onto function — A function f from A to B is onto if every element of B is an image of some element of A.",
  ],
  "Inverse Trigonometric Functions": [
    "Principal value — The principal value branch of inverse sine maps values into the closed interval minus pi by two to pi by two.",
    "Domain — The domain of inverse tangent is the set of all real numbers.",
    "Identity — Sin inverse x plus cos inverse x equals pi by two for x in the closed unit interval.",
    "Range — The range of inverse cosine is the closed interval zero to pi.",
    "Tan inverse identity — Tan inverse x plus cot inverse x equals pi by two for all real x.",
  ],
  Matrices: [
    "Transpose — The transpose of a product of matrices equals the product of their transposes in reverse order.",
    "Symmetric matrix — A square matrix equals its transpose if and only if it is symmetric.",
    "Singular matrix — A matrix is singular if and only if its determinant is zero.",
    "Non-commutativity — Matrix multiplication is not commutative in general.",
    "Identity matrix — The identity matrix is the neutral element under matrix multiplication.",
  ],
  Determinants: [
    "Row operation — Adding a multiple of one row to another leaves the determinant unchanged.",
    "Skew-symmetric — The determinant of a skew-symmetric matrix of odd order is zero.",
    "Adjoint — The product of a matrix and its adjoint equals the determinant times the identity matrix.",
    "Cramer's rule — Cramer's rule solves a system of linear equations using determinants when the coefficient determinant is non-zero.",
    "Scaling — Multiplying one row of a matrix by a scalar multiplies the determinant by the same scalar.",
  ],
  "Continuity and Differentiability": [
    "Chain rule — The derivative of a composite function is the product of derivatives of the outer and inner functions.",
    "Rolle's theorem — Rolle's theorem guarantees a point with zero derivative when a continuous function has equal values at the endpoints.",
    "Logarithmic differentiation — Logarithmic differentiation simplifies differentiation of products and powers of functions.",
    "Continuity — A function is continuous at a point if the limit equals the function value at that point.",
    "Mean value theorem — The mean value theorem states that there exists a point where the tangent is parallel to the chord joining the endpoints.",
  ],
  "Application of Derivatives": [
    "First derivative test — A function has a local maximum at a point where its derivative changes from positive to negative.",
    "Second derivative test — If f double dash at a critical point is negative, the point is a local maximum.",
    "Increasing function — A differentiable function is strictly increasing on an interval where its derivative is positive throughout.",
    "Tangent slope — The slope of the tangent to a curve at a point equals the derivative at that point.",
    "Approximation — Differentials give approximate change in a function for a small change in the independent variable.",
  ],
  Integrals: [
    "Integration by parts — Integration by parts is based on the product rule of differentiation.",
    "Definite integral — The definite integral of a function from a to b equals F of b minus F of a by the fundamental theorem.",
    "Substitution — The substitution method uses the chain rule in reverse.",
    "Odd function — The definite integral of an odd function over a symmetric interval is zero.",
    "Periodic function — Integration of a periodic function over one full period repeated n times scales the result by n.",
  ],
  "Application of Integrals": [
    "Area under curve — The area between a curve and the x-axis from a to b is the definite integral of the function.",
    "Area between curves — The area between two curves is the integral of upper curve minus lower curve.",
    "Symmetry — Areas symmetric about the y-axis can be computed as twice the area on one side.",
    "Non-negative integrand — Area is computed only where the curve lies above the axis as a positive quantity.",
    "Line boundaries — Areas bounded by lines and curves are found by identifying intersection points as limits.",
  ],
  "Differential Equations": [
    "Order — The order of a differential equation is the order of the highest derivative occurring in it.",
    "Degree — The degree is the power of the highest derivative after making the equation polynomial in derivatives.",
    "Variable separable — A variable separable equation can be written with all y terms with dy and all x terms with dx.",
    "Homogeneous equation — A homogeneous differential equation is solved by substituting y equals v x.",
    "Linear equation — A linear differential equation of first order has an integrating factor based on the coefficient of y.",
  ],
  "Vector Algebra": [
    "Scalar product — The scalar product of two vectors is commutative.",
    "Vector product — The vector product of two vectors is perpendicular to both and anti-commutative.",
    "Scalar triple product — The scalar triple product gives the volume of the parallelepiped formed by three vectors.",
    "Distributivity — The vector product distributes over addition.",
    "Collinearity — Two vectors are collinear if and only if their vector product is the zero vector.",
  ],
  "Three Dimensional Geometry": [
    "Direction cosines — The sum of squares of direction cosines of a line equals one.",
    "Skew lines — Skew lines are neither parallel nor intersecting and lie in different planes.",
    "Shortest distance — The shortest distance between two skew lines is found using the scalar triple product of direction and connecting vectors.",
    "Plane normal — A plane is uniquely determined by its normal vector and a point it passes through.",
    "Line-plane — A line is parallel to a plane if its direction is perpendicular to the plane's normal.",
  ],
  "Linear Programming": [
    "Feasible region — The feasible region of a linear programming problem is a convex polygon.",
    "Corner point rule — The optimal value of a linear objective function occurs at a corner point of the feasible region.",
    "Unbounded region — An unbounded feasible region may have no optimal solution.",
    "Objective function — In graphical linear programming, the objective function is optimised by moving its level line across the feasible region.",
    "Constraints — Linear constraints divide the plane into half-planes whose intersection forms the feasible set.",
  ],
  Probability: [
    "Conditional probability — P of A given B equals P of A intersection B divided by P of B.",
    "Independent events — Two events are independent if the occurrence of one does not affect the probability of the other.",
    "Bayes' theorem — Bayes' theorem reverses conditional probabilities using the law of total probability.",
    "Binomial distribution — The mean of a binomial distribution is n p and variance is n p q.",
    "Mutual exclusion — For mutually exclusive events, P of A union B equals P of A plus P of B.",
  ],

  // ---------------- Biology ----------------
  "Sexual Reproduction in Flowering Plants": [
    "Pollination — Pollination is the transfer of pollen grains from the anther to the stigma of the same flower or another flower.",
    "Double fertilisation — Double fertilisation involves one male gamete fusing with the egg and another with the polar nuclei.",
    "Embolism prevention — Blocking of sieve tubes by callose plugs prevents loss of sap due to embolism.",
    "Apomixis — Apomixis is a form of asexual reproduction that mimics sexual reproduction without fertilisation.",
    "Pollen-pistil interaction — Pollen-pistil interaction involves chemical recognition between pollen and stigma.",
  ],
  "Human Reproduction": [
    "Spermatogenesis — Spermatogenesis occurs in the seminiferous tubules of the testes under FSH and LH control.",
    "Oogenesis — Oogenesis begins before birth and arrests at prophase I until puberty.",
    "Menstrual cycle — The menstrual cycle is controlled by FSH, LH, oestrogen and progesterone hormones.",
    "Fertilisation — Fertilisation in humans normally occurs in the ampulla of the fallopian tube.",
    "Implantation — Implantation of the blastocyst occurs in the uterine endometrium about a week after fertilisation.",
  ],
  "Reproductive Health": [
    "Contraception — Contraceptive methods include barrier methods, hormonal methods, IUDs and surgical procedures.",
    "STDs — Sexually transmitted infections like HIV are spread through unprotected sexual contact.",
    "IVF — In vitro fertilisation is an assisted reproductive technique where fertilisation occurs outside the body.",
    "MTP — Medical termination of pregnancy is legal under specified conditions in India.",
    "Amniocentesis — Amniocentesis is used for detecting chromosomal disorders but is misused for sex determination.",
  ],
  "Principles of Inheritance and Variation": [
    "Mendel's law — Mendel's law of segregation states that two alleles of a gene separate during gamete formation.",
    "Dihybrid ratio — The phenotypic ratio of a dihybrid cross in the F2 generation is nine to three to three to one.",
    "Linkage — Linked genes on the same chromosome tend to be inherited together, reducing recombination.",
    "Sex determination — In humans, sex is determined by the X and Y chromosomes, with males being heterogametic.",
    "Pedigree analysis — Pedigree analysis uses family charts to infer the pattern of inheritance of a trait.",
  ],
  "Molecular Basis of Inheritance": [
    "DNA structure — DNA is a double helix with antiparallel strands and complementary base pairing.",
    "Genetic code — The genetic code is nearly universal, degenerate and non-overlapping.",
    "Transcription — Transcription is the synthesis of RNA from a DNA template under RNA polymerase.",
    "Translation — Translation is protein synthesis from mRNA at the ribosome using tRNA adapters.",
    "Human genome project — The Human genome project aimed to sequence the entire human DNA and identify all genes.",
  ],
  Evolution: [
    "Hardy–Weinberg — The Hardy–Weinberg principle states allele frequencies remain constant in the absence of evolutionary forces.",
    "Natural selection — Natural selection acts on phenotypes and changes allele frequencies over generations.",
    "Adaptive radiation — Adaptive radiation is the diversification of a species into multiple forms adapted to different niches.",
    "Homologous organs — Homologous organs indicate common ancestry despite different functions.",
    "Origin of life — Chemical evolution proposed that life arose from simple organic molecules on early Earth.",
  ],
  "Human Health and Disease": [
    "Immunity — Innate immunity is non-specific and present from birth, while adaptive immunity is specific and has memory.",
    "AIDS — AIDS is caused by HIV which attacks helper T lymphocytes of the immune system.",
    "Cancer — Cancer is characterised by uncontrolled cell division and can be detected by biopsy and imaging.",
    "Vaccination — Vaccination works by stimulating active immunity without causing the disease.",
    "Drug abuse — Drug abuse leads to addiction due to dependence created in the brain's reward pathways.",
  ],
  "Microbes in Human Welfare": [
    "Yoghurt — Microbes like Lactobacillus are used to set curd from milk.",
    "Sewage treatment — Sewage treatment uses microbial digestion to reduce biological oxygen demand of waste water.",
    "Biogas — Biogas produced by methanogenic bacteria contains methane and is used as fuel.",
    "Biocontrol — Biocontrol agents like Bacillus thuringiensis are used against insect pests.",
    "Antibiotics — Antibiotics like penicillin are produced by microorganisms and used to treat bacterial infections.",
  ],
  "Biotechnology: Principles and Processes": [
    "Genetic engineering — Genetic engineering involves manipulation of DNA using restriction enzymes, vectors and host cells.",
    "PCR — Polymerase chain reaction amplifies a DNA segment through repeated cycles of denaturation, annealling and extension.",
    "Restriction enzymes — Restriction enzymes cut DNA at specific recognition sequences producing sticky or blunt ends.",
    "Bioreactors — Bioreactors are vessels used for large-scale cultivation of cells producing the desired product.",
    "Gel electrophoresis — Gel electrophoresis separates DNA fragments by size for analysis.",
  ],
  "Biotechnology and its Applications": [
    "Bt cotton — Bt cotton expresses a cry protein toxic to specific lepidopteran insects.",
    "Insulin production — Human insulin is produced in bacteria using recombinant DNA technology.",
    "Gene therapy — Gene therapy corrects genetic disorders by introducing functional genes into patients' cells.",
    "Molecular diagnosis — Molecular diagnosis using PCR detects pathogens at very early stages of infection.",
    "Transgenic animals — Transgenic animals are engineered to study gene function or produce therapeutic proteins.",
  ],
  "Organisms and Populations": [
    "Population attributes — Population attributes include size, density, birth rate, death rate and age distribution.",
    "Population interactions — Interactions include competition, predation, parasitism, commensalism and mutualism.",
    "Survivorship curves — Survivorship curves are of types I, II and III based on age-specific mortality patterns.",
    "Adaptations — Organisms show morphological, physiological and behavioural adaptations to their environment.",
    "Ecological niche — A niche describes the functional role and position of a species in its community.",
  ],
  Ecosystem: [
    "Energy flow — Energy flow in an ecosystem is unidirectional and decreases at each trophic level.",
    "Ecological pyramids — Ecological pyramids of energy are always upright.",
    "Productivity — Net primary productivity is the energy available to consumers after plant respiration.",
    "Nutrient cycling — Unlike energy flow, nutrients in an ecosystem cycle between biotic and abiotic components.",
    "Succession — Ecological succession is the sequential change in species composition of a community over time.",
  ],
  "Biodiversity and Conservation": [
    "Biodiversity levels — Biodiversity is measured at genetic, species and ecosystem levels.",
    "Hotspots — Biodiversity hotspots are regions with high endemism and severe habitat loss.",
    "In-situ conservation — In-situ conservation protects species in their natural habitats, such as in national parks.",
    "Ex-situ conservation — Ex-situ conservation maintains threatened species in zoos, botanical gardens and seed banks.",
    "Extinction — The current rate of species extinction is estimated to be far above the natural background rate.",
  ],

  // ---------------- English Core ----------------
  "The Last Lesson": [
    "Alphonse Daudet — The Last Lesson is written by Alphonse Daudet and set in Alsace during the Franco-Prussian War.",
    "Franz — Franz is a schoolboy narrator who feels regret for neglecting his French lessons.",
    "Theme — The story highlights the pain of losing one's mother tongue under foreign domination.",
    "M. Hamel — M. Hamel is the dedicated French teacher who delivers his last lesson with dignity.",
  ],
  "Lost Spring": [
    "Anees Jung — Lost Spring is authored by Anees Jung and highlights the plight of street children.",
    "Firozabad — Firozabad is known for its glass-blowing industry where children work in hazardous conditions.",
    "Child labour — The narrative exposes how poverty traps children in cycles of labour and illiteracy.",
    "Bangle makers — Generations of bangle makers in Firozabad remain in the same profession without alternatives.",
  ],
  "Deep Water": [
    "William Douglas — Deep Water is an autobiographical extract by William Douglas about overcoming fear of water.",
    "Y.M.C.A. pool — The Y.M.C.A. pool was safer than the beach at Ocean Park because it was shallow and guarded.",
    "Instructor — The instructor broke Douglas's water phobia through gradual, disciplined training.",
    "Theme — The story conveys that willpower and effort can defeat deep-seated fears.",
  ],
  "The Rattrap": [
    "Selma Lagerlöf — The Rattrap is by Selma Lagerlöf, a Nobel laureate Swedish writer.",
    "Peddler — The peddler sells rattraps and uses the metaphor to describe the world as a rattrap.",
    "Edla — Edla Willmansson shows compassion that redeems the peddler from his deceit.",
    "Redemption — The story ends with the peddler's reformation through an act of kindness.",
  ],
  "Indigo": [
    "Louis Fischer — Indigo is written by Louis Fischer and chronicles Gandhi's Champaran movement.",
    "Champaran — Champaran was the site where Gandhi first applied satyagraha in India.",
    "Rajkumar Shukla — Rajkumar Shukla, a sharecropper, invited Gandhi to Champaran persistently.",
    "Civil disobedience — The movement used civil disobedience to challenge the unjust tinkathia system.",
  ],
  "My Mother at Sixty-Six": [
    "Kamala Das — My Mother at Sixty-Six is a poem by Kamala Das about ageing and filial anxiety.",
    "Imagery — The poem contrasts the mother's dozing, ashen face with the merry children outside.",
    "Theme — The poem expresses the speaker's fear of losing her mother and her own ageing.",
    "Free verse — The poem uses free verse with a streaming, conversational style.",
  ],
  "Keeping Quiet": [
    "Pablo Neruda — Keeping Quiet is a poem by Pablo Neruda advocating introspection and universal brotherhood.",
    "Silence — The poet proposes twelve minutes of self-examination without rush or noise.",
    "Symbolism — Silence symbolises a break from destructive human activity and war.",
    "Exotic moment — The 'exotic moment' is a stillness that lets humanity reflect and reconnect.",
  ],
  "A Thing of Beauty": [
    "John Keats — A Thing of Beauty is the opening poem of Endymion by John Keats.",
    "Theme — Keats affirms that beauty provides enduring joy and lifts us above gloom.",
    "Immortal — A thing of beauty is said to be an endless fountain of immortal joy.",
    "Romanticism — The poem embodies Romantic ideals of nature, beauty and imagination.",
  ],
  "Aunt Jennifer's Tigers": [
    "Adrienne Rich — Aunt Jennifer's Tigers is by Adrienne Rich, depicting a woman oppressed in marriage.",
    "Tigers — The tigers symbolise Aunt Jennifer's unfulfilled desire for courage and freedom.",
    "Contrast — There is a sharp contrast between the fearless tigers in her art and her timid real life.",
    "Needlework — Her stiff, frightened hands show how patriarchal oppression limits her even in art.",
  ],
  "The Interview": [
    "Christopher Silvester — The Interview by Christopher Silvester traces the history and value of interviews.",
    "Value — The interview gives the public direct access to the thoughts of famous personalities.",
    "Criticism — Critics argue interviews can be intrusive and may distort a person's image.",
    "Literary form — Interviews have themselves become a respected form of literary expression.",
  ],

  // ---------------- Accountancy ----------------
  "Accounting for Not-for-Profit Organisations": [
    "Receipt and payment account — The receipt and payment account is a summary of cash and bank transactions of a NPO.",
    "Income and expenditure — The income and expenditure account is prepared on an accrual basis like a profit and loss account.",
    "Subscriptions — Subscriptions are the main source of income for a not-for-profit organisation.",
    "Capital fund — The balance sheet of an NPO ends with the capital fund, the residual of assets over liabilities.",
  ],
  "Accounting for Partnership: Basic Concepts": [
    "Profit and loss appropriation — The profit and loss appropriation account shows distribution of profit among partners.",
    "Partnership deed — A partnership deed governs the terms including profit sharing, interest and salary of partners.",
    "Current account — Fluctuating capital systems merge all adjustments into a single capital account.",
    "Interest on capital — Interest on capital is an appropriation of profit, not a charge against it.",
  ],
  "Reconstitution of Partnership": [
    "Goodwill — Goodwill is the value of a firm's reputation and earning capacity beyond identifiable assets.",
    "Revaluation — A revaluation account records gains and losses on reassessment of assets and liabilities at reconstitution.",
    "New profit-sharing ratio — The new profit-sharing ratio adjusts for the incoming or outgoing partner's share.",
    "Sacrificing ratio — The sacrificing ratio measures how much old partners give up for the incoming partner.",
  ],
  "Dissolution of Partnership Firm": [
    "Realisation account — A realisation account is opened on dissolution to record sale of assets and settlement of liabilities.",
    "Dissolution — Dissolution of a firm means the business relationship among all partners ends.",
    "Gain ratio — The gain ratio applies when a continuing partner gains due to another's retirement.",
    "Cash settlement — On dissolution, cash is distributed to partners after settling external liabilities in order of payment.",
  ],
  "Accounting for Share Capital": [
    "Issue at premium — Shares issued at a premium record the excess over face value in the securities premium reserve.",
    "Forfeiture — Forfeiture of shares cancels allotment to defaulting shareholders and transfers money to the forfeiture account.",
    "Par issue — Shares issued at par record proceeds equal to the face value.",
    "Private placement — Private placement is the issue of shares to a selected group rather than the public.",
  ],
  "Accounting for Debentures": [
    "Debentures — Debentures are long-term borrowings of a company carrying a fixed rate of interest.",
    "Debenture redemption reserve — A debenture redemption reserve is created out of profits for redeeming debentures.",
    "Issue at discount — Debentures may be issued at a discount which is written off over their life.",
    "Interest on debentures — Interest on debentures is a charge against profit and must be paid regardless of earnings.",
  ],
  "Financial Statements of Companies": [
    "Schedule III — Companies in India prepare financial statements in the format prescribed by Schedule III of the Companies Act.",
    "Balance sheet — The company balance sheet shows equity and liabilities on one side and assets on the other.",
    "Notes to accounts — Notes to accounts explain line items and accounting policies of the company.",
    "Statement of profit and loss — The statement of profit and loss reports revenue, other income and expenses for the period.",
  ],
  "Analysis of Financial Statements": [
    "Comparative statements — Comparative financial statements show changes in items across periods in amount and percentage.",
    "Common-size statements — Common-size statements express each item as a percentage of a base figure such as revenue.",
    "Trend analysis — Trend analysis computes percentages of a base year to study direction of change over years.",
    "Users — Stakeholders such as investors and creditors use financial statement analysis for decisions.",
  ],
  "Ratio Analysis": [
    "Current ratio — Current ratio equals current assets divided by current liabilities and measures liquidity.",
    "Debt-equity ratio — Debt-equity ratio compares long-term debt to shareholders' funds to assess leverage.",
    "Return on investment — Return on investment measures profit earned per unit of capital employed.",
    "Quick ratio — The quick ratio excludes inventory from current assets for a stricter liquidity test.",
  ],

  // ---------------- Business Studies ----------------
  "Nature and Significance of Management": [
    "Management definition — Management is the process of planning, organising, staffing, directing and controlling resources to achieve goals efficiently.",
    "Effectiveness — Effectiveness means completing activities and achieving goals on time.",
    "Coordination — Coordination is the essence of management, integrating all functions and activities.",
    "Levels of management — Management levels are divided into top, middle and lower levels.",
  ],
  "Principles of Management": [
    "Fayol's principles — Fayol proposed fourteen principles of management including unity of command and division of work.",
    "Unity of command — Unity of command states that an employee should receive orders from one superior only.",
    "Scientific management — Taylor's scientific management focuses on one best way to perform a task.",
    "Differential piece rate — Taylor's differential piece-rate system motivates workers by paying higher rates for higher output.",
  ],
  "Business Environment": [
    "PEST analysis — PEST analysis studies political, economic, social and technological factors affecting business.",
    "Liberalisation — Liberalisation of 1991 reduced government control and opened the Indian economy to competition.",
    "Internal environment — The internal environment includes values, culture, employees and objectives of the organisation.",
    "Demonetisation — Demonetisation of 2016 invalidated high-denomination notes and pushed digital transactions.",
  ],
  Planning: [
    "Planning process — The planning process involves setting objectives, developing premises, evaluating alternatives and implementing.",
    "Types of plans — Plans include policy, procedure, rule, method, budget and programme.",
    "Limitations — Planning may become rigid and is based on predictions that may not hold.",
    "Decision-making — Decision-making involves choosing the best alternative from available options.",
  ],
  Organising: [
    "Delegation — Delegation involves assignment of authority and responsibility to a subordinate.",
    "Decentralisation — Decentralisation distributes decision-making authority throughout the organisation.",
    "Formal organisation — Formal organisation is created by management with defined authority relationships.",
    "Departmentalisation — Departmentalisation groups activities on the basis of function, product, geography or process.",
  ],
  Staffing: [
    "Staffing process — Staffing involves manpower planning, recruitment, selection, placement, training and appraisal.",
    "Recruitment — Recruitment may be internal or external and influences the quality of the workforce.",
    "Training methods — Training methods include on-the-job methods like apprenticeship and off-the-job methods like lectures.",
    "Performance appraisal — Performance appraisal evaluates employee performance for promotion and development decisions.",
  ],
  Directing: [
    "Motivation — Motivation is the process of stimulating people to act towards achieving goals.",
    "Leadership styles — Leadership styles include autocratic, democratic and laissez-faire.",
    "Communication — Communication is the exchange of information between sender and receiver with understanding.",
    "Maslow's hierarchy — Maslow proposed a hierarchy of needs from physiological to self-actualisation.",
  ],
  Controlling: [
    "Controlling process — Controlling involves setting standards, measuring performance, comparing and taking corrective action.",
    "Management by exception — Management by exception focuses managerial attention on significant deviations from standards.",
    "Critical control point — Critical control points are key results where measurement is most efficient.",
    "Relationship with planning — Controlling is the last function of management and is closely linked to planning.",
  ],
  "Financial Management": [
    "Financial goals — The primary financial goals are profit maximisation and wealth maximisation.",
    "Capital structure — Capital structure is the mix of debt and equity used to finance a firm.",
    "Working capital — Working capital equals current assets minus current liabilities.",
    "Trading on equity — Trading on equity increases return on equity when the firm earns more on borrowed funds than the interest cost.",
  ],
  "Marketing Management": [
    "Marketing mix — The marketing mix comprises product, price, place and promotion.",
    "Product life cycle — The product life cycle stages are introduction, growth, maturity and decline.",
    "Promotion mix — The promotion mix includes advertising, personal selling, sales promotion and public relations.",
    "Pricing methods — Pricing methods include cost-plus, competition-based and value-based pricing.",
  ],

  // ---------------- Economics ----------------
  "National Income and Related Aggregates": [
    "GDP — Gross domestic product is the market value of all final goods and services produced within a country in a period.",
    "Value added — Value added equals value of output minus value of intermediate consumption.",
    "Real GDP — Real GDP measures output at constant prices, removing the effect of price changes.",
    "Income method — The income method sums factor incomes earned in production: wages, rent, interest and profit.",
  ],
  "Money and Banking": [
    "Money supply — Money supply measures the stock of money held by the public at a particular point of time.",
    "Credit creation — Commercial banks create credit through the money multiplier based on the reserve ratio.",
    "Central bank — The central bank is the banker's bank, controller of credit and custodian of foreign exchange.",
    "Repo rate — The repo rate is the rate at which the central bank lends to commercial banks against securities.",
  ],
  "Determination of Income and Employment": [
    "Multiplier — The investment multiplier equals one divided by one minus marginal propensity to consume.",
    "Deficient demand — Deficient demand creates a deflationary gap and leads to unemployment.",
    "Consumption function — The consumption function shows the relationship between income and consumption expenditure.",
    "Aggregate demand — Aggregate demand is the total demand for final goods and services in an economy.",
  ],
  "Government Budget and the Economy": [
    "Fiscal deficit — Fiscal deficit is the excess of total expenditure over total receipts excluding borrowings.",
    "Revenue receipts — Revenue receipts include tax revenue and non-tax revenue of the government.",
    "Primary deficit — Primary deficit equals fiscal deficit minus interest payments.",
    "Budget components — A budget comprises receipts, expenditure, and estimates of the coming financial year.",
  ],
  "Balance of Payments": [
    "Current account — The current account records trade in goods, services and unilateral transfers.",
    "Capital account — The capital account records capital transactions such as loans and investments.",
    "Managed floating — Managed floating combines market determination with occasional central bank intervention.",
    "Autonomous transactions — Autonomous transactions are independent of the balance of payments position.",
  ],
  "Indian Economy on the Eve of Independence": [
    "Low growth — The Indian economy at independence showed a low rate of growth with stagnant agriculture.",
    "Drain of wealth — Colonial rule involved a drain of wealth from India to Britain through various channels.",
    "Occupational structure — The occupational structure was overwhelmingly agricultural with a small industrial base.",
    "Infrastructure — Railways, ports and irrigation facilities were developed primarily to serve colonial interests.",
  ],
  "Indian Economy 1950–1990": [
    "Five year plans — India adopted five-year plans from 1951 to guide planned economic development.",
    "Green revolution — The Green Revolution of the 1960s increased foodgrain production using HYV seeds and fertilisers.",
    "Land reforms — Land reforms aimed to abolish intermediaries and improve the condition of tenants.",
    "Industrial policy — The industrial policy resolution of 1956 classified industries into three schedules for public sector leadership.",
  ],
  "Liberalisation, Privatisation and Globalisation": [
    "New economic policy — The new economic policy of 1991 aimed at liberalising, privatising and globalising the Indian economy.",
    "Liberalisation measures — Liberalisation removed licensing requirements and reduced areas reserved for the public sector.",
    "WTO — India is a founding member of the World Trade Organization which promotes free and fair trade.",
    "Globalisation effects — Globalisation increased competition, technology transfer and access to foreign goods.",
  ],
  "Human Capital Formation": [
    "Human capital — Human capital refers to the stock of skills, knowledge and health embodied in the population.",
    "Sources — Major sources of human capital formation are education, training, health and migration.",
    "Human development — Human development is a broader concept than human capital, covering freedom and quality of life.",
    "Education expenditure — Investment in education raises productivity and economic growth.",
  ],
  "Rural Development": [
    "Rural credit — Rural credit comes from formal sources like banks and informal sources like moneylenders.",
    "Agricultural diversification — Diversification moves rural workforce towards allied activities, fisheries and poultry.",
    "Organic farming — Organic farming avoids chemicals and promotes sustainable agriculture for healthier produce.",
    "Marketing — Proper agricultural marketing ensures farmers receive a fair price for their produce.",
  ],
  Employment: [
    "Casualisation — Casualisation is the increase in the proportion of casual wage workers in total employment.",
    "Informalisation — Informalisation means growth of employment in the informal sector without job security.",
    "Unemployment — Unemployment types include seasonal, disguised, frictional and structural unemployment.",
    "Employment schemes — Programmes like MGNREGA guarantee wage employment in rural areas.",
  ],
  "Environment and Sustainable Development": [
    "Environment functions — The environment supplies resources, assimilates waste and sustains life.",
    "Sustainable development — Sustainable development meets present needs without compromising future generations' ability to meet theirs.",
    "Carrying capacity — Carrying capacity is the maximum load an environment can sustain without deterioration.",
    "Global warming — Global warming from greenhouse gases threatens ecological balance and requires collective action.",
  ],

  // ---------------- Computer Science ----------------
  Functions: [
    "Default arguments — A function can have default arguments which take effect when no actual arguments are passed.",
    "Inline functions — Inline functions are expanded at compile time to reduce function call overhead.",
    "Function overloading — Function overloading allows multiple functions with the same name but different parameter lists.",
    "Recursion — A recursive function must have a base case to terminate.",
  ],
  "Classes and Objects": [
    "Constructor — A constructor is a special member function that initialises objects and has the same name as the class.",
    "Destructor — A destructor releases resources when an object's lifetime ends.",
    "Friend function — A friend function can access private members of a class though it is not a member of it.",
    "Static members — Static data members are shared by all objects of a class.",
  ],
  "Data Structures": [
    "Stack — A stack follows last-in-first-out order for push and pop operations.",
    "Queue — A queue follows first-in-first-out order with insertion at the rear and deletion at the front.",
    "Linked list — A linked list stores elements in nodes where each node points to the next.",
    "Stack application — Expression evaluation and function call management are classic applications of stacks.",
  ],
  "Databases and SQL": [
    "DDL — Data definition language commands like CREATE, ALTER and DROP define database structure.",
    "DML — Data manipulation language commands like SELECT, INSERT, UPDATE and DELETE operate on data.",
    "Primary key — A primary key uniquely identifies each row in a table and cannot be null.",
    "JOIN — A join combines rows from two or more tables based on a related column.",
  ],
  "Interface Python with SQL": [
    "sqlite3 — Python's sqlite3 module provides an interface to SQLite databases for CRUD operations.",
    "Connection — A database connection is established before executing any SQL statements from Python.",
    "Cursor — A cursor object is used to execute SQL queries and fetch results in Python.",
    "Error handling — Database programs should handle exceptions like integrity errors and connection failures.",
  ],
  "Computer Networks": [
    "Network types — Networks are classified as LAN, MAN and WAN based on geographical coverage.",
    "Transmission media — Transmission media include twisted pair, coaxial cable, fibre optic and wireless.",
    "Protocols — Protocols are sets of rules that govern data communication between devices.",
    "Client-server — In the client-server model, servers provide services that clients request over the network.",
  ],
};

export function factsForChapter(chapter: string): string[] {
  return FACT_BANK[chapter] ?? [];
}

/** Words that carry no signal when matching a question against the fact bank. */
const STOPWORDS = new Set([
  "the", "and", "for", "with", "that", "this", "what", "why", "how", "when", "where",
  "who", "which", "tell", "explain", "give", "about", "from", "into", "does", "are",
  "was", "were", "has", "have", "had", "you", "your", "our", "its", "can", "could",
  "should", "would", "there", "their", "them", "then", "than", "but", "not", "all",
  "any", "some", "get", "got", "let", "use", "using", "used", "like", "just", "also",
  "chapter", "subject", "syllabus", "notes", "note", "please", "help", "me", "my",
  "know", "need", "want", "make", "made", "more", "most", "much", "many", "very",
  "will", "shall", "may", "must", "out", "off", "over", "under", "again", "same",
]);

export interface FactHit {
  chapter: string;
  concept: string;
  statement: string;
  score: number;
}

/**
 * Search the whole bank by concept name, so a question like "explain Gauss's law"
 * finds the Gauss's law fact even though it never names the chapter.
 */
export function searchFacts(query: string, limit = 24): FactHit[] {
  const q = (query || "").toLowerCase();
  if (!q.trim()) return [];
  const tokens = Array.from(new Set(q.match(/[a-z][a-z'’-]{2,}/g) ?? [])).filter(
    (t) => !STOPWORDS.has(t)
  );
  if (!tokens.length) return [];

  const hits: FactHit[] = [];
  for (const [chapter, facts] of Object.entries(FACT_BANK)) {
    const chapterLower = chapter.toLowerCase();
    const chapterTokens = chapterLower.match(/[a-z][a-z'’-]{2,}/g) ?? [];
    for (const fact of facts) {
      const sep = fact.indexOf("—");
      const concept = (sep === -1 ? fact : fact.slice(0, sep)).trim();
      const statement = sep === -1 ? fact : fact.slice(sep + 1).trim();
      const cl = concept.toLowerCase();
      let score = 0;
      if (cl.length > 3 && q.includes(cl)) score += 12;
      for (const t of tokens) {
        if (cl.includes(t)) score += 4;
      }
      // The chapter itself being named is a strong signal.
      if (chapterLower.length > 3 && q.includes(chapterLower)) score += 20;
      for (const t of chapterTokens) {
        if (tokens.includes(t)) score += 6;
      }
      if (score === 0) continue;
      hits.push({ chapter, concept, statement, score });
    }
  }
  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}
