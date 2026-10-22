// CBSE Class 12 curriculum knowledge base.
// Chapter/topic lists mirror the standard CBSE Class 12 syllabus and are used to
// seed subjects with the right chapters and topics.

export interface CurriculumChapter {
  name: string;
  topics: string[];
}

export interface CurriculumSubject {
  name: string;
  chapters: CurriculumChapter[];
}

export const CURRICULUM: Record<string, CurriculumSubject> = {
  Physics: {
    name: "Physics",
    chapters: [
      { name: "Electric Charges and Fields", topics: ["Coulomb's law", "Electric field of a point charge", "Electric dipole", "Gauss's law", "Electric flux", "Field due to a uniformly charged ring", "Properties of electric field lines"] },
      { name: "Electrostatic Potential and Capacitance", topics: ["Electric potential", "Potential due to a dipole", "Equipotential surfaces", "Capacitance", "Parallel plate capacitor", "Dielectrics and polarisation", "Energy stored in a capacitor", "Combination of capacitors"] },
      { name: "Current Electricity", topics: ["Ohm's law", "Drift velocity", "Kirchhoff's laws", "Wheatstone bridge", "Meter bridge", "Potentiometer", "Temperature dependence of resistivity", "Colour code of resistors"] },
      { name: "Moving Charges and Magnetism", topics: ["Biot–Savart law", "Ampere's circuital law", "Solenoid and toroid", "Force on a moving charge", "Cyclotron", "Magnetic dipole moment", "Current loop as a magnetic dipole"] },
      { name: "Magnetism and Matter", topics: ["Bar magnet as an equivalent solenoid", "Dipole in a uniform magnetic field", "Magnetic susceptibility", "Hysteresis", "Earth's magnetism", "Magnetic field lines"] },
      { name: "Electromagnetic Induction", topics: ["Magnetic flux", "Faraday's law of induction", "Lenz's law", "Motional emf", "Inductance", "Eddy currents", "Self and mutual inductance"] },
      { name: "Alternating Current", topics: ["AC voltage applied to a resistor", "LCR circuits", "Resonance", "Power in AC circuits", "Generators", "Transformers"] },
      { name: "Electromagnetic Waves", topics: ["Displacement current", "EM waves", "Properties of EM waves", "Electromagnetic spectrum", "Nature of light"] },
      { name: "Ray Optics and Optical Instruments", topics: ["Reflection of light", "Spherical mirrors", "Refraction", "Total internal reflection", "Refraction at spherical surfaces", "Lenses", "Lens maker's formula", "Dispersion", "Microscopes", "Telescopes"] },
      { name: "Wave Optics", topics: ["Huygens principle", "Interference", "Young's double slit experiment", "Diffraction", "Polarisation", "Brewster's law", "Coherent and incoherent addition of waves"] },
      { name: "Dual Nature of Radiation and Matter", topics: ["Photoelectric effect", "Einstein's photoelectric equation", "Matter waves", "de Broglie relation", "Davisson–Germer experiment", "Photon"] },
      { name: "Atoms", topics: ["Rutherford's model", "Bohr model", "Energy levels", "Hydrogen spectrum", "Line spectra", "Atomic transitions"] },
      { name: "Nuclei", topics: ["Nuclear size and density", "Mass–energy relation", "Nuclear binding energy", "Radioactivity", "Alpha, beta and gamma decay", "Law of radioactive decay", "Fission and fusion", "Half-life"] },
      { name: "Semiconductor Electronics", topics: ["Intrinsic and extrinsic semiconductors", "p-n junction", "Semiconductor diodes", "Zener diode", "Rectifiers", "Logic gates", "Special purpose diodes", "Transistors"] },
    ],
  },
  Chemistry: {
    name: "Chemistry",
    chapters: [
      { name: "Solutions", topics: ["Raoult's law", "Vapour pressure", "Ideal and non-ideal solutions", "Azeotropes", "Henry's law", "Colligative properties", "Relative lowering of vapour pressure", "Osmosis and osmotic pressure", "Abnormal molar mass"] },
      { name: "Electrochemistry", topics: ["Galvanic cells", "Nernst equation", "Conductance", "Electrolytic cells", "Faraday's laws of electrolysis", "Batteries", "Corrosion", "Fuel cells", "Molar conductivity"] },
      { name: "Chemical Kinetics", topics: ["Rate of reaction", "Factors affecting rate", "Rate law", "Order and molecularity", "Integrated rate equations", "Half-life period", "Activation energy", "Arrhenius equation", "Collision theory"] },
      { name: "The d- and f-Block Elements", topics: ["General introduction", "Electronic configuration", "Metallic character", "Ionisation enthalpy", "Atomic radii", "Variable oxidation states", "Catalytic properties", "Lanthanoids", "Actinoids", "Characteristics of d-block elements"] },
      { name: "Coordination Compounds", topics: ["Werner's theory", "IUPAC nomenclature", "Isomerism", "Valence bond theory", "Crystal field theory", "Magnetic properties", "Importance in qualitative analysis", "Metal carbonyls"] },
      { name: "Haloalkanes and Haloarenes", topics: ["Nomenclature", "Nature of C–X bond", "Methods of preparation", "Physical properties", "Substitution reactions", "Optical rotation", "Haloarenes", "Uses and environmental effects"] },
      { name: "Alcohols, Phenols and Ethers", topics: ["Nomenclature", "Preparation of alcohols", "Properties of alcohols", "Phenols", "Ether synthesis", "Electrophilic substitution", "Acidity of phenols", "Uses"] },
      { name: "Aldehydes, Ketones and Carboxylic Acids", topics: ["Nomenclature", "Preparation methods", "Nature of carbonyl group", "Nucleophilic addition reactions", "Aldol condensation", "Cannizzaro reaction", "Carboxylic acids", "Acidity", "Methods of preparation"] },
      { name: "Amines", topics: ["Nomenclature", "Classification", "Preparation of amines", "Physical properties", "Chemical reactions", "Diazonium salts", "Basicity of amines", "Carbylamine reaction"] },
      { name: "Biomolecules", topics: ["Carbohydrates", "Proteins", "Enzymes", "Vitamins", "Nucleic acids", "DNA and RNA", "Hormones", "Classification of biomolecules"] },
    ],
  },
  Mathematics: {
    name: "Mathematics",
    chapters: [
      { name: "Relations and Functions", topics: ["Types of relations", "Types of functions", "Composition of functions", "Invertible functions", "Binary operations", "Equivalence relations"] },
      { name: "Inverse Trigonometric Functions", topics: ["Definition and domain", "Range", "Principal value branch", "Properties of inverse trigonometric functions", "Compositions"] },
      { name: "Matrices", topics: ["Types of matrices", "Matrix operations", "Transpose", "Symmetric and skew-symmetric matrices", "Elementary row operations", "Invertible matrices"] },
      { name: "Determinants", topics: ["Determinant of a matrix", "Properties of determinants", "Minors and cofactors", "Adjoint of a matrix", "Inverse of a matrix", "Application to systems of equations", "Cramer's rule"] },
      { name: "Continuity and Differentiability", topics: ["Continuity", "Differentiability", "Chain rule", "Derivatives of inverse trigonometric functions", "Implicit differentiation", "Exponential and logarithmic functions", "Mean value theorem", "Rolle's theorem"] },
      { name: "Application of Derivatives", topics: ["Rate of change", "Tangents and normals", "Increasing and decreasing functions", "Maxima and minima", "First derivative test", "Second derivative test", "Approximation", "Curve sketching"] },
      { name: "Integrals", topics: ["Integration", "Integration by substitution", "Partial fractions", "Integration by parts", "Definite integrals", "Fundamental theorem of calculus", "Properties of definite integrals", "Limit of a sum"] },
      { name: "Application of Integrals", topics: ["Area under curves", "Area between two curves", "Simple curves", "Region bounded by a curve and lines"] },
      { name: "Differential Equations", topics: ["Order and degree", "Formation of differential equations", "Solving differential equations", "Variable separable method", "Homogeneous equations", "Linear differential equations", "Bernoulli's equation"] },
      { name: "Vector Algebra", topics: ["Vector operations", "Scalar product", "Vector product", "Section formula", "Scalar triple product", "Vector triple product", "Geometric interpretation"] },
      { name: "Three Dimensional Geometry", topics: ["Direction cosines", "Direction ratios", "Equation of a line", "Skew lines", "Shortest distance between two lines", "Equation of a plane", "Angle between planes", "Distance of a point from a plane"] },
      { name: "Linear Programming", topics: ["Linear programming problems", "Graphical method", "Feasible region", "Corner points", "Optimisation", "Multiple and unbounded solutions"] },
      { name: "Probability", topics: ["Conditional probability", "Multiplication theorem", "Independent events", "Bayes' theorem", "Random variables", "Probability distribution", "Mean and variance", "Bernoulli trials and binomial distribution"] },
    ],
  },
  Biology: {
    name: "Biology",
    chapters: [
      { name: "Sexual Reproduction in Flowering Plants", topics: ["Pre-fertilisation events", "Flower structure", "Pollination", "Outbreeding devices", "Pollen-pistil interaction", "Double fertilisation", "Post-fertilisation events", "Apomixis and polyembryony"] },
      { name: "Human Reproduction", topics: ["Male reproductive system", "Female reproductive system", "Gametogenesis", "Menstrual cycle", "Fertilisation and implantation", "Embryo development", "Parturition", "Lactation"] },
      { name: "Reproductive Health", topics: ["Reproductive health problems", "Contraceptive methods", "Medical termination of pregnancy", "Sexually transmitted infections", "Assisted reproductive technologies", "Amniocentesis"] },
      { name: "Principles of Inheritance and Variation", topics: ["Mendel's laws", "Dihybrid cross", "Linkage and recombination", "Sex determination", "Mutation", "Pedigree analysis", "Genetic disorders", "Chromosomal disorders"] },
      { name: "Molecular Basis of Inheritance", topics: ["DNA structure", "DNA replication", "RNA", "Transcription", "Genetic code", "Translation", "Regulation of gene expression", "Human genome project", "DNA fingerprinting"] },
      { name: "Evolution", topics: ["Origin of life", "Evidence for evolution", "Hardy–Weinberg principle", "Mechanisms of evolution", "Human evolution", "Adaptive radiation"] },
      { name: "Human Health and Disease", topics: ["Common diseases", "Immunity", "AIDS", "Cancer", "Drugs and alcohol abuse", "Adolescence issues"] },
      { name: "Microbes in Human Welfare", topics: ["Microbes in household products", "Industrial products", "Sewage treatment", "Biogas", "Microbes as biocontrol agents", "Biofertilisers"] },
      { name: "Biotechnology: Principles and Processes", topics: ["Principles of biotechnology", "Genetic engineering tools", "Steps of rDNA technology", "PCR", "Bioreactors", "Downstream processing"] },
      { name: "Biotechnology and its Applications", topics: ["Bt crops", "Human insulin", "Gene therapy", "Molecular diagnosis", "Transgenic animals", "Bio-ethics", "Golden rice"] },
      { name: "Organisms and Populations", topics: ["Organism and its environment", "Population attributes", "Population growth curves", "Life history variation", "Population interactions", "Predation", "Competition", "Parasitism"] },
      { name: "Ecosystem", topics: ["Ecosystem structure", "Productivity", "Energy flow", "Ecological pyramids", "Nutrient cycling", "Ecological succession", "Ecological services"] },
      { name: "Biodiversity and Conservation", topics: ["Levels of biodiversity", "Patterns of biodiversity", "Importance of biodiversity", "Loss of biodiversity", "Conservation strategies", "Hotspots", "In-situ and ex-situ conservation"] },
    ],
  },
  "English Core": {
    name: "English Core",
    chapters: [
      { name: "The Last Lesson", topics: ["Alphonse Daudet", "Franco-Prussian war context", "Characterisation of Franz", "Theme of linguistic chauvinism", "Key incidents", "Narrative voice"] },
      { name: "Lost Spring", topics: ["Anees Jung", "Child labour", "Sweeping and bangle making", "Firozabad", "Themes of poverty and exploitation", "Author's tone"] },
      { name: "Deep Water", topics: ["William Douglas", "Fear of water", "Y.M.C.A. pool incident", "Instructor's training", "Overcoming fear", "Psychological insights"] },
      { name: "The Rattrap", topics: ["Selma Lagerlöf", "Peddler's deception", "Edla's compassion", "Irony and redemption", "Symbolism of the rattrap"] },
      { name: "Indigo", topics: ["Louis Fischer", "Gandhi's Champaran movement", "Sharecroppers' plight", "Rajkumar Shukla", "Significance of civil disobedience"] },
      { name: "My Mother at Sixty-Six", topics: ["Kamala Das", "Imagery of ageing", "Contrast of youth and decay", "Emotions of the speaker", "Poetic devices"] },
      { name: "Keeping Quiet", topics: ["Pablo Neruda", "Introspection", "Symbolism of silence", "Universal brotherhood", "Poetic devices"] },
      { name: "A Thing of Beauty", topics: ["John Keats", "Beauty as a source of joy", "Immortality", "Grandeur and glory", "Romantic ideals"] },
      { name: "Aunt Jennifer's Tigers", topics: ["Adrienne Rich", "Symbolism of tigers", "Contrast between art and life", "Patriarchal oppression", "Poetic craft"] },
      { name: "The Interview", topics: ["Christopher Silvester", "History of interviews", "Value and limits of interviews", "Interview as a literary form", "Author's viewpoint"] },
    ],
  },
  Accountancy: {
    name: "Accountancy",
    chapters: [
      { name: "Accounting for Not-for-Profit Organisations", topics: ["Receipt and payment account", "Income and expenditure account", "Balance sheet", "Subscription accounting", "Special funds"] },
      { name: "Accounting for Partnership: Basic Concepts", topics: ["Partnership deed", "Profit and loss appropriation", "Capital and current accounts", "Interest on capital", "Guarantee of profit"] },
      { name: "Reconstitution of Partnership", topics: ["Admission of a partner", "Retirement and death", "Goodwill valuation", "Revaluation of assets", "New profit-sharing ratio"] },
      { name: "Dissolution of Partnership Firm", topics: ["Dissolution versus reconstitution", "Realisation account", "Settlement of claims", "Distribution of cash", "Insolvency of partners"] },
      { name: "Accounting for Share Capital", topics: ["Issue of shares", "Forfeiture of shares", "Reissue of shares", "Presentation of share capital", "Private placement"] },
      { name: "Accounting for Debentures", topics: ["Issue of debentures", "Interest on debentures", "Redemption of debentures", "Debenture redemption reserve"] },
      { name: "Financial Statements of Companies", topics: ["Balance sheet format", "Statement of profit and loss", "Schedule III requirements", "Notes to accounts"] },
      { name: "Analysis of Financial Statements", topics: ["Financial statement analysis", "Comparative statements", "Common-size statements", "Tools of analysis"] },
      { name: "Ratio Analysis", topics: ["Liquidity ratios", "Solvency ratios", "Activity ratios", "Profitability ratios", "Interpretation of ratios"] },
    ],
  },
  "Business Studies": {
    name: "Business Studies",
    chapters: [
      { name: "Nature and Significance of Management", topics: ["Management definition", "Objectives of management", "Levels of management", "Management as an art, science and profession", "Coordination"] },
      { name: "Principles of Management", topics: ["Fayol's principles", "Taylor's scientific management", "Difference between the two", "Applicability of principles"] },
      { name: "Business Environment", topics: ["External and internal environment", "PEST analysis", "Liberalisation and globalisation", "Demonetisation", "Role of government"] },
      { name: "Planning", topics: ["Nature of planning", "Types of plans", "Planning process", "Limitations of planning", "Decision-making"] },
      { name: "Organising", topics: ["Organising process", "Delegation", "Decentralisation", "Formal and informal organisation", "Departmentalisation"] },
      { name: "Staffing", topics: ["Staffing process", "Recruitment", "Selection", "Training methods", "Performance appraisal"] },
      { name: "Directing", topics: ["Motivation", "Leadership styles", "Communication process", "Financial and non-financial incentives"] },
      { name: "Controlling", topics: ["Controlling process", "Techniques of control", "Management by exception", "Relationship with planning"] },
      { name: "Financial Management", topics: ["Financial goals", "Capital structure", "Working capital", "Investment decisions", "Financing decisions"] },
      { name: "Marketing Management", topics: ["Marketing concept", "Marketing mix", "Product life cycle", "Pricing decisions", "Promotion mix"] },
    ],
  },
  Economics: {
    name: "Economics",
    chapters: [
      { name: "National Income and Related Aggregates", topics: ["GDP and GNP", "National income methods", "Value added method", "Income method", "Expenditure method", "Real and nominal GDP", "Limitations of national income estimates"] },
      { name: "Money and Banking", topics: ["Money functions", "Money supply", "Commercial banks", "Central bank functions", "Credit creation", "Monetary policy instruments"] },
      { name: "Determination of Income and Employment", topics: ["Aggregate demand and supply", "Consumption function", "Investment multiplier", "Excess and deficient demand", "Measures to correct deflation"] },
      { name: "Government Budget and the Economy", topics: ["Components of budget", "Revenue and capital receipts", "Fiscal deficit", "Budget deficits", "Demand and supply side effects"] },
      { name: "Balance of Payments", topics: ["Balance of payments accounts", "Current account", "Capital account", "Foreign exchange rate", "Managed floating", "Autonomous and accommodating transactions"] },
      { name: "Indian Economy on the Eve of Independence", topics: ["Low level of development", "Agriculture", "Industrial structure", "Foreign trade", "Occupational distribution", "Infrastructure"] },
      { name: "Indian Economy 1950–1990", topics: ["Five year plans", "Land reforms", "Green Revolution", "Industrial policy resolution", "Import substitution", "Employment growth"] },
      { name: "Liberalisation, Privatisation and Globalisation", topics: ["New economic policy 1991", "Liberalisation measures", "Privatisation", "Globalisation", "WTO and Indian economy", "Positive and negative effects"] },
      { name: "Human Capital Formation", topics: ["Human capital vs human development", "Sources of human capital", "Education and health expenditure", "Growth of education", "Government initiatives"] },
      { name: "Rural Development", topics: ["Rural credit", "Agricultural market system", "Diversification", "Organic farming", "Sustainable development"] },
      { name: "Employment", topics: ["Growth of employment", "Casualisation", "Informalisation", "Unemployment types", "Government employment schemes"] },
      { name: "Environment and Sustainable Development", topics: ["Environment functions", "Carrying capacity", "Sustainable development", "Conditions for sustainable growth", "Global warming"] },
    ],
  },
  "Computer Science": {
    name: "Computer Science",
    chapters: [
      { name: "Functions", topics: ["User-defined functions", "Default arguments", "Inline functions", "Function overloading", "Recursion", "Passing parameters"] },
      { name: "Classes and Objects", topics: ["Class definition", "Data members and member functions", "Constructors", "Destructors", "Friend functions", "Static members", "Object lifetime"] },
      { name: "Data Structures", topics: ["Stacks", "Queues", "Linked lists", "Operations on stacks", "Applications of stacks", "Circular queues"] },
      { name: "Databases and SQL", topics: ["Relational model", "SQL commands", "DDL and DML", "Joins", "Aggregate functions", "Constraints", "Normalization basics"] },
      { name: "Interface Python with SQL", topics: ["sqlite3 module", "CRUD operations", "Connection handling", "Error handling", "Python-SQL integration"] },
      { name: "Computer Networks", topics: ["Network types", "Transmission media", "Network devices", "Protocols", "Client-server model", "Network security basics"] },
    ],
  },
};

export const SUBJECT_NAMES = Object.keys(CURRICULUM);
