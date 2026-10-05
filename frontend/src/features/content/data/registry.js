/**
 * Article registry · the single source of truth for all published
 * content. Static imports (no dynamic `import('./articles/' + slug)`)
 * because dynamic imports with computed paths are awkward with CRA's
 * webpack and break bundler-side static analysis.
 *
 * To add an article: import it here, add to ARTICLES, done. The
 * registry order is the default chronological list (newest first
 * after the sort below). Filtering happens via `listArticles({...})`.
 */
import warumFrameworksNichtImKopfBleiben from './articles/warum-frameworks-nicht-im-kopf-bleiben';
import sprintOderMarathon from './articles/sprint-oder-marathon';
import dieFeedbackFormelBww from './articles/die-feedback-formel-bww';
import wieLenaIhrTownhallDrehte from './articles/wie-lena-ihr-townhall-drehte';
import deinKalenderFuehrtDich from './articles/dein-kalender-fuehrt-dich';
import kiImFuehrungsAlltagDreiUseCases from './articles/ki-im-fuehrungs-alltag-drei-use-cases';
import chatgptAlsSparringPartnerFuenfSkripte from './articles/chatgpt-als-sparring-partner-fuenf-skripte';
import warumLeaderOs from './articles/warum-leader-os';
import wasInLeaderOsDrinIst from './articles/was-in-leader-os-drin-ist';
import deinErsterTagMitLeaderOs from './articles/dein-erster-tag-mit-leader-os';
import wladbotVsChatgptVsCoach from './articles/wladbot-vs-chatgpt-vs-coach';
import leaderOsFuerEngineeringLeitung from './articles/leader-os-fuer-engineering-leitung';
import leaderOsFuerHrUndPeopleOps from './articles/leader-os-fuer-hr-und-people-ops';
import leaderOsFuerScaleupGruender from './articles/leader-os-fuer-scaleup-gruender';
import leaderOsImTeamRollout from './articles/leader-os-im-team-rollout';
import derBusinessCaseFuerLeaderOs from './articles/der-business-case-fuer-leader-os';
import leaderOsVsKlassischesCoaching from './articles/leader-os-vs-klassisches-coaching';
import kiLeadershipWasBedeutetDasKonkret from './articles/ki-leadership-was-bedeutet-das-konkret';
import mitarbeitergespraechVorbereitenMitKi from './articles/mitarbeitergespraech-vorbereiten-mit-ki';
import feedbackGebenVorlageBwwFramework from './articles/feedback-geben-vorlage-bww-framework';
import townhallRedeStrukturierenSexier from './articles/townhall-rede-strukturieren-sexier';
import harvardVerhandlungsmethodeErklaert from './articles/harvard-verhandlungsmethode-erklaert';
import schulzVonThunKommunikationsquadratFuerFuehrungskraefte from './articles/schulz-von-thun-kommunikationsquadrat-fuer-fuehrungskraefte';
import alpenMethodeFuerFuehrungskraefte from './articles/alpen-methode-fuer-fuehrungskraefte';
import fuenfRollenDerFuehrungNachWladJachtchenko from './articles/5-rollen-der-fuehrung-nach-wlad-jachtchenko';
import dreiSaeulenDerUeberzeugungLogosEthosPathos from './articles/drei-saeulen-der-ueberzeugung-logos-ethos-pathos';
import vierFarbenModellPersonalities from './articles/vier-farben-modell-personalities';
import dunkleRhetorikErkennenUndAbwehren from './articles/dunkle-rhetorik-erkennen-und-abwehren';
import konfliktgespraechFuehrenSkript from './articles/konfliktgespraech-fuehren-skript';
import kuendigungsgespraechRichtigFuehren from './articles/kuendigungsgespraech-richtig-fuehren';
import gehaltsgespraechVorbereitenSkript from './articles/gehaltsgespraech-vorbereiten-skript';
import schlagfertigkeitLernenAlsFuehrungskraft from './articles/schlagfertigkeit-lernen-als-fuehrungskraft';
import zehnStufenDesZuhoerens from './articles/zehn-stufen-des-zuhoerens';
import promptEngineeringFuerFuehrungskraefte from './articles/prompt-engineering-fuer-fuehrungskraefte';
import kiToolsFuerFuehrungskraefte2026 from './articles/ki-tools-fuer-fuehrungskraefte-2026';
import leaderOsFuerMittelstandCeo from './articles/leader-os-fuer-mittelstand-ceo';
import leaderOsFuerCtoUndTechVorstand from './articles/leader-os-fuer-cto-und-tech-vorstand';
import leaderOsFuerVertriebsleitung from './articles/leader-os-fuer-vertriebsleitung';
import leaderOsFuerNeuBefoerderteLeads from './articles/leader-os-fuer-neu-befoerderte-leads';
import kiStrategieFuerMittelstand from './articles/ki-strategie-fuer-mittelstand';
import erste100TageAlsCtoOderVpEngineering from './articles/erste-100-tage-als-cto-oder-vp-engineering';
import kiCoachingVsTraditionellesCoachingDach from './articles/ki-coaching-vs-traditionelles-coaching-dach';
// +20 KI-Paradox & System bucket
import dasKiProduktivitaetsParadox from './articles/das-ki-produktivitaets-paradox';
import warumDeinChatgptTabDichNichtEffizienterMacht from './articles/warum-dein-chatgpt-tab-dich-nicht-effizienter-macht';
import wennDeineKiInvestitionVersickertFuenfDiagnoseFragen from './articles/wenn-deine-ki-investition-versickert-fuenf-diagnose-fragen';
import kiToolMuedigkeitWasZuTunIst from './articles/ki-tool-muedigkeit-was-zu-tun-ist';
import outputMessenImKiZeitalter from './articles/output-messen-im-ki-zeitalter';
import warum90ProzentAllerKiTrainingsScheitern from './articles/warum-90-prozent-aller-ki-trainings-scheitern';
import dasSystemHinterDemSystem from './articles/das-system-hinter-dem-system';
import damitEsJederSchafftDieZugaenglichkeitsPhilosophie from './articles/damit-es-jeder-schafft-die-zugaenglichkeits-philosophie';
import mikroDrillsFuenfzehnMinutenProTag from './articles/mikro-drills-fuenfzehn-minuten-pro-tag';
import dieLeaderOsKursArchitektur from './articles/die-leader-os-kurs-architektur';
import mehrAlsEineTransformation from './articles/mehr-als-eine-transformation';
import kiWissenVsKiReflex from './articles/ki-wissen-vs-ki-reflex';
import vomEinzelErfolgZumTeamSystem from './articles/vom-einzel-erfolg-zum-team-system';
import wennKiDichVerlangsamt from './articles/wenn-ki-dich-verlangsamt';
import derLernpfadVomKiNutzerZumKiLeader from './articles/der-lernpfad-vom-ki-nutzer-zum-ki-leader';
import systemStattTransformationDerKleineHebel from './articles/system-statt-transformation-der-kleine-hebel';
import dreiRitualeDieKiInvestmentsRentabelMachen from './articles/drei-rituale-die-ki-investments-rentabel-machen';
import dieKursBibliothekStrukturiertePfadeDurchLeaderOs from './articles/die-kurs-bibliothek-strukturierte-pfade-durch-leader-os';
import vomPowerUserZumMultiplikator from './articles/vom-power-user-zum-multiplikator';
import kiInZehnMinutenProTag from './articles/ki-in-zehn-minuten-pro-tag';
import kiOhneMethodikIstSlop from './articles/ki-ohne-methodik-ist-slop';
import derKiSprintWasDreissigTageStrukturierteAnwendungVeraendern from './articles/der-ki-sprint-was-dreissig-tage-strukturierte-anwendung-veraendern';
import fuerJedenMitarbeiterNichtNurFuerFuehrungskraefte from './articles/fuer-jeden-mitarbeiter-nicht-nur-fuer-fuehrungskraefte';
import dasVersprechenUndDieGrenzen from './articles/das-versprechen-und-die-grenzen';
import die5RollenEinerKiNativenFuehrungskraft from './articles/die-5-rollen-einer-ki-nativen-fuehrungskraft';
import in6MonatenZurKiNativenFuehrungskraft from './articles/in-6-monaten-zur-ki-nativen-fuehrungskraft';
import schlagfertigkeitImKiZeitalter from './articles/schlagfertigkeit-im-ki-zeitalter';

// ── 2026-07 · Training / Team-Training / Coaching cluster (DACH) ──
// 20 SEO pillars competing on the "Führungskräftetraining" / "Teamtraining" /
// "Leadership Coaching" head-terms owned by Haufe-Akademie & Co. Each links
// back to fuehrungskraeftetraining-formate-im-vergleich as the anchor pillar.
import fuehrungskraeftetrainingKostenWasEinGutesTrainingWirklichKostet from './articles/fuehrungskraeftetraining-kosten-was-ein-gutes-training-wirklich-kostet';
import teamtrainingVsEinzelcoachingWasWirktWann from './articles/teamtraining-vs-einzelcoaching-was-wirkt-wann';
import inhouseSchulungVsOffenesSeminarEntscheidungshilfe from './articles/inhouse-schulung-vs-offenes-seminar-entscheidungshilfe';
import leadershipCoachingProgrammInternAufsetzenHrGuide from './articles/leadership-coaching-programm-intern-aufsetzen-hr-guide';
import dieBestenFuehrungskraeftetrainings2026WoraufEsAnkommt from './articles/die-besten-fuehrungskraeftetrainings-2026-worauf-es-ankommt';
import teambuildingVsTeamtrainingDerUnterschied from './articles/teambuilding-vs-teamtraining-der-unterschied';
import roiVonFuehrungskraeftetrainingMessen from './articles/roi-von-fuehrungskraeftetraining-messen';
import warumInhouseTrainingsNachSechsWochenVerpuffen from './articles/warum-inhouse-trainings-nach-sechs-wochen-verpuffen';
import blendedLearningFuerFuehrungskraefte from './articles/blended-learning-fuer-fuehrungskraefte';
import leadershipCoachingFuerFrauenInFuehrungspositionen from './articles/leadership-coaching-fuer-frauen-in-fuehrungspositionen';
import groupCoachingVsEinzelcoachingFuerFuehrungskraefte from './articles/group-coaching-vs-einzelcoaching-fuer-fuehrungskraefte';
import fuehrungskraefteCurriculumFuerDenMittelstandAufbauen from './articles/fuehrungskraefte-curriculum-fuer-den-mittelstand-aufbauen';
import peerCoachingInFuehrungsteams from './articles/peer-coaching-in-fuehrungsteams';
import ebbinghausVergessenskurveImFuehrungskraeftetraining from './articles/ebbinghaus-vergessenskurve-im-fuehrungskraeftetraining';
import microLearningVsKlassischesSeminarFuerFuehrungskraefte from './articles/micro-learning-vs-klassisches-seminar-fuer-fuehrungskraefte';
import fuehrungskraeftetrainingMitKiSkalierenTrainTheTrainer from './articles/fuehrungskraeftetraining-mit-ki-skalieren-train-the-trainer';
import teamentwicklungNachTuckmanFuerFuehrungskraefte from './articles/teamentwicklung-nach-tuckman-fuer-fuehrungskraefte';
import coachingZertifizierungFuerFuehrungskraefteIcfDbvcErklaert from './articles/coaching-zertifizierung-fuer-fuehrungskraefte-icf-dbvc-erklaert';
import newWorkFuehrungstrainingWasSichSeitHomeofficeGeaendertHat from './articles/new-work-fuehrungstraining-was-sich-seit-homeoffice-geaendert-hat';
import wieVieleTrainingstageBrauchtEineFuehrungskraftProJahr from './articles/wie-viele-trainingstage-braucht-eine-fuehrungskraft-pro-jahr';

// ── 2026-08/09 expansion batch (20 new SEO articles) ──
import ChatgptAlsCoPilot7PromptsFuerFuehrungskraefte from './articles/chatgpt-als-co-pilot-7-prompts-fuer-fuehrungskraefte';
import ClaudeVsChatgptVsGeminiWelcheKiFuerWelchenJob from './articles/claude-vs-chatgpt-vs-gemini-welche-ki-fuer-welchen-job';
import KiHalluzinationenErkennenAlsManager from './articles/ki-halluzinationen-erkennen-als-manager';
import MitKi12StundenProWocheZurueckgewinnen from './articles/mit-ki-12-stunden-pro-woche-zurueckgewinnen';
import ScrumFuerNichtTechManager from './articles/scrum-fuer-nicht-tech-manager';
import OkrVsKpiWannWelcheMethode from './articles/okr-vs-kpi-wann-welche-methode';
import EisenhowerMatrixImKiZeitalter from './articles/eisenhower-matrix-im-ki-zeitalter';
import ParetoPrinzipInDerFuehrung from './articles/pareto-prinzip-in-der-fuehrung';
import KonstruktiveKonfrontationDasBwwSkript from './articles/konstruktive-konfrontation-das-bww-skript';
import Verhandlungstaktiken5PhrasenDieDeinePositionStaerken from './articles/verhandlungstaktiken-5-phrasen-die-deine-position-staerken';
import TownhallSpeechesDie7MinutenRegel from './articles/townhall-speeches-die-7-minuten-regel';
import SchlagfertigkeitGegenManipulationDreiVerteidigungen from './articles/schlagfertigkeit-gegen-manipulation-drei-verteidigungen';
import StorytellingFuerFuehrungskraeftePixarFormel from './articles/storytelling-fuer-fuehrungskraefte-pixar-formel';
import ImposterSyndromBeiCLevel from './articles/imposter-syndrom-bei-c-level';
import GehaltsverhandlungAlsFuehrungskraftDrehbuch from './articles/gehaltsverhandlung-als-fuehrungskraft-drehbuch';
import VomManagerZumDirectorWasWirklichAndersWird from './articles/vom-manager-zum-director-was-wirklich-anders-wird';
import BurnoutBeiTopPerformernDieWarnsignale from './articles/burnout-bei-top-performern-die-warnsignale';
import DieErsten7TageMitLeaderOs from './articles/die-ersten-7-tage-mit-leader-os';
import SprintVsPlusPlusWelcherPfad from './articles/sprint-vs-plus-plus-welcher-pfad';
// Players'-Tribune-style narrative SEO bombs
import briefAnMeinen28JaehrigenSelbst from './articles/brief-an-meinen-28-jaehrigen-selbst-bevor-ich-team-lead-wurde';
import derTagAnDemIchAufhoerteZuPushen from './articles/der-tag-an-dem-ich-aufhoerte-zu-pushen';
import dreiBurnoutsEineLektion from './articles/drei-burnouts-eine-lektion';
import liebeMitarbeiterDasHierWollteIch from './articles/liebe-mitarbeiter-das-hier-wollte-ich-euch-immer-sagen';
// 2026-06-26 · Authority + Definitional + Comparison pillars · designed for
// AI Overview / Perplexity / ChatGPT citation. Each carries a Wlad cover
// image, full SEO armor with 9+ long-tail keywords, and structured Q+A-shaped
// h2 headings so LLMs can lift sections cleanly.
import werIstWladJachtchenko from './articles/wer-ist-wlad-jachtchenko';
import wasIstEineKiNativeFuehrungskraft from './articles/was-ist-eine-ki-native-fuehrungskraft';
import leaderOsVsChatgptClaudePerplexity from './articles/leader-os-vs-chatgpt-claude-perplexity';
// 2026-06-29 · Leadership-development SEO pillars · target the head terms
// owned by Haufe-Akademie / DAM / Hees (transformationale, laterale,
// fachliche/disziplinarische Führung, Führungskräfteentwicklung). Full
// SEO armor, definitional H2s, topic-cluster cross-links.
import transformationaleFuehrung from './articles/transformationale-fuehrung';
import lateraleFuehrung from './articles/laterale-fuehrung';
import fachlicheVsDisziplinarischeFuehrung from './articles/fachliche-vs-disziplinarische-fuehrung';
import fuehrungskraefteentwicklung from './articles/fuehrungskraefteentwicklung-leadership-development';
// 2026-06-30 · cluster articles · 2 supporting pieces per pillar, each
// internal-linking up to its pillar + a sibling (topic-cluster topical
// authority to out-rank the academies on the long-tails they ignore).
import transformationaleVsTransaktionaleFuehrung from './articles/transformationale-vs-transaktionale-fuehrung';
import transformationaleFuehrungBeispiele from './articles/transformationale-fuehrung-beispiele';
import fuehrenOhneWeisungsbefugnis from './articles/fuehren-ohne-weisungsbefugnis';
import matrixOrganisationFuehren from './articles/matrix-organisation-fuehren';
import fachlicheFuehrungOhneDisziplinarischeVerantwortung from './articles/fachliche-fuehrung-ohne-disziplinarische-verantwortung';
import fuehrungsverantwortungWasBedeutetDas from './articles/fuehrungsverantwortung-was-bedeutet-das';
import fuehrungskompetenzenDieWichtigsten from './articles/fuehrungskompetenzen-die-wichtigsten';
import fuehrungskraeftetrainingFormateImVergleich from './articles/fuehrungskraeftetraining-formate-im-vergleich';
// 2026-07-02 Reels-Serie · aus Wlads täglichen Führungstipps (@wlad.jachtchenko)
import charismaCodeDreiSignale from './articles/charisma-code-drei-signale-die-den-raum-entscheiden';
import elevatorPitchFuerFuehrungskraefte from './articles/elevator-pitch-fuer-fuehrungskraefte-die-30-sekunden-formel';
import mitarbeiterMotivation40 from './articles/mitarbeiter-motivation-4-0-was-wirklich-zieht';
import dieErstenSiebenSekunden from './articles/die-ersten-sieben-sekunden-wie-fuehrung-wirkt-bevor-du-sprichst';
import koerperspracheUndStimme from './articles/koerpersprache-und-stimme-die-unterschaetzten-fuehrungswerkzeuge';
// 2026-07-11 → 2026-07-20 · viral leadership/AI/communication expansion (20
// articles) · AI-leadership crossover, communication-framework deep-dives,
// narrative/personal-essay pieces.
import shadowKiWarumDeinTeamHeimlichChatgptNutzt from './articles/shadow-ki-warum-dein-team-heimlich-chatgpt-nutzt';
import die10StufenDesZuhoerensWladsModellErklaert from './articles/die-10-stufen-des-zuhoerens-wlads-modell-erklaert';
import die4GespraechstypenInformierenUeberzeugenVerhandelnKonfrontieren from './articles/die-4-gespraechstypen-informieren-ueberzeugen-verhandeln-konfrontieren';
import fuehrungsEinsamkeitWarumNiemandDarueberSpricht from './articles/fuehrungs-einsamkeit-warum-niemand-darueber-spricht';
import dieDreiSaetzeDieGuteVonSchlechtenChefsUnterscheiden from './articles/die-drei-saetze-die-gute-von-schlechten-chefs-unterscheiden';
import warumKiDichZuEinemSchlechterenZuhoererMacht from './articles/warum-ki-dich-zu-einem-schlechteren-zuhoerer-macht';
import micromanagementErkennenBeiDirSelbst from './articles/micromanagement-erkennen-bei-dir-selbst';
import wieDuEinTeamUebernimmstDasDichNichtWollte from './articles/wie-du-ein-team-uebernimmst-das-dich-nicht-wollte';
import stilleKuendigungErkennenBevorSiePassiert from './articles/stille-kuendigung-erkennen-bevor-sie-passiert';
import einsZuEinsImKiZeitalterWasBotsNichtKoennen from './articles/1-zu-1s-im-ki-zeitalter-was-bots-nicht-koennen';
import kiGenerierteMitarbeiterbewertungenDieFallstricke from './articles/ki-generierte-mitarbeiterbewertungen-die-fallstricke';
import warumOpenDoorPolicyNichtFunktioniert from './articles/warum-open-door-policy-nicht-funktioniert';
import kiBiasInBefoerderungsentscheidungen from './articles/ki-bias-in-befoerderungsentscheidungen';
import dieErsteFuehrungsentscheidungDieIchBereutHabe from './articles/die-erste-fuehrungsentscheidung-die-ich-bereut-habe';
import warumEhrlicheKiDirMehrHilftAlsEinHoeflicherChef from './articles/warum-ehrliche-ki-dir-mehr-hilft-als-ein-hoeflicher-chef';
import eMailsDieAutoritaetZeigenDreiRegeln from './articles/e-mails-die-autoritaet-zeigen-drei-regeln';
import schwierigeNachrichtenAsyncUeberbringenSlackTeams from './articles/schwierige-nachrichten-async-ueberbringen-slack-teams';
import warumDieBestenChefsDieSchlechtestenMentorenSind from './articles/warum-die-besten-chefs-die-schlechtesten-mentoren-sind';
import derKiKompetenzGapZwischenJuniorUndSeniorFuehrungskraeften from './articles/der-ki-kompetenz-gap-zwischen-junior-und-senior-fuehrungskraeften';
import wieDuNeinSagstOhneUnbeliebtZuWerden from './articles/wie-du-nein-sagst-ohne-unbeliebt-zu-werden';
import die5ArgumentationsLevelsVonBehauptungBisSexier from './articles/die-5-argumentations-levels-von-behauptung-bis-sexier';

// +20 Journal-Artikel 2026-09-30: Gespräche, Führungsalltag, Team, Modelle, KI-Richtlinien
import delegierenLernenDieFuenfStufenDerDelegation from './articles/delegieren-lernen-die-fuenf-stufen-der-delegation';
import einwaendeImGespraechEntkraeftenFuerFuehrungskraefte from './articles/einwaende-im-gespraech-entkraeften-fuer-fuehrungskraefte';
import einzelgespraecheMitMitarbeiternStrukturFragenRhythmus from './articles/einzelgespraeche-mit-mitarbeitern-struktur-fragen-rhythmus';
import entscheidungenTreffenUnterUnsicherheit from './articles/entscheidungen-treffen-unter-unsicherheit';
import fragenStellenWieFuehrungskraefteMitFragenFuehren from './articles/fragen-stellen-wie-fuehrungskraefte-mit-fragen-fuehren';
import growModellCoachingGespraechFuerFuehrungskraefte from './articles/grow-modell-coaching-gespraech-fuer-fuehrungskraefte';
import jahresgespraechFuehrenAblaufFragenUndFehler from './articles/jahresgespraech-fuehren-ablauf-fragen-und-fehler';
import johariFensterBlindeFleckenAlsFuehrungskraft from './articles/johari-fenster-blinde-flecken-als-fuehrungskraft';
import kiRichtlinienFuersTeamPraktischerLeitfaden from './articles/ki-richtlinien-fuers-team-praktischer-leitfaden';
import konflikteImTeamFruehErkennenUndAnsprechen from './articles/konflikte-im-team-frueh-erkennen-und-ansprechen';
import lobAussprechenAnerkennungDieWirkt from './articles/lob-aussprechen-anerkennung-die-wirkt';
import meetingsLeitenAgendaEntscheidungNaechsteSchritte from './articles/meetings-leiten-agenda-entscheidung-naechste-schritte';
import neueMitarbeiterOnboardenDieErsten30Tage from './articles/neue-mitarbeiter-onboarden-die-ersten-30-tage';
import ownershipImTeamStaerkenVerantwortungUebergeben from './articles/ownership-im-team-staerken-verantwortung-uebergeben';
import praesentationHaltenAufbauFuerFuehrungskraefte from './articles/praesentation-halten-aufbau-fuer-fuehrungskraefte';
import psychologischeSicherheitImTeamAufbauen from './articles/psychologische-sicherheit-im-team-aufbauen';
import qAndASouveraenFuehrenSchwierigeFragenBeantworten from './articles/q-and-a-souveraen-fuehren-schwierige-fragen-beantworten';
import remoteTeamFuehrenRoutinenRegelnVertrauen from './articles/remote-team-fuehren-routinen-regeln-vertrauen';
import situativesFuehrenNachHerseyUndBlanchard from './articles/situatives-fuehren-nach-hersey-und-blanchard';
import underperformerFuehrenDasGespraechUndDerPlan from './articles/underperformer-fuehren-das-gespraech-und-der-plan';

const ARTICLES = [
  // 2026-09-30 · +20 Artikel (Gespräche, Führungsalltag, Team, Modelle, KI-Richtlinien)
  delegierenLernenDieFuenfStufenDerDelegation,
  einwaendeImGespraechEntkraeftenFuerFuehrungskraefte,
  einzelgespraecheMitMitarbeiternStrukturFragenRhythmus,
  entscheidungenTreffenUnterUnsicherheit,
  fragenStellenWieFuehrungskraefteMitFragenFuehren,
  growModellCoachingGespraechFuerFuehrungskraefte,
  jahresgespraechFuehrenAblaufFragenUndFehler,
  johariFensterBlindeFleckenAlsFuehrungskraft,
  kiRichtlinienFuersTeamPraktischerLeitfaden,
  konflikteImTeamFruehErkennenUndAnsprechen,
  lobAussprechenAnerkennungDieWirkt,
  meetingsLeitenAgendaEntscheidungNaechsteSchritte,
  neueMitarbeiterOnboardenDieErsten30Tage,
  ownershipImTeamStaerkenVerantwortungUebergeben,
  praesentationHaltenAufbauFuerFuehrungskraefte,
  psychologischeSicherheitImTeamAufbauen,
  qAndASouveraenFuehrenSchwierigeFragenBeantworten,
  remoteTeamFuehrenRoutinenRegelnVertrauen,
  situativesFuehrenNachHerseyUndBlanchard,
  underperformerFuehrenDasGespraechUndDerPlan,
  // 2026-07-21 · canon-gap framework pillar (5 Argumentations-Levels — the
  // architecture SEXIER lives in as Level 4; source: WLAD_CANON.md)
  die5ArgumentationsLevelsVonBehauptungBisSexier,
  // 2026-07-11 → 2026-07-20 · viral leadership/AI/communication expansion
  shadowKiWarumDeinTeamHeimlichChatgptNutzt,
  die10StufenDesZuhoerensWladsModellErklaert,
  die4GespraechstypenInformierenUeberzeugenVerhandelnKonfrontieren,
  fuehrungsEinsamkeitWarumNiemandDarueberSpricht,
  dieDreiSaetzeDieGuteVonSchlechtenChefsUnterscheiden,
  warumKiDichZuEinemSchlechterenZuhoererMacht,
  micromanagementErkennenBeiDirSelbst,
  wieDuEinTeamUebernimmstDasDichNichtWollte,
  stilleKuendigungErkennenBevorSiePassiert,
  einsZuEinsImKiZeitalterWasBotsNichtKoennen,
  kiGenerierteMitarbeiterbewertungenDieFallstricke,
  warumOpenDoorPolicyNichtFunktioniert,
  kiBiasInBefoerderungsentscheidungen,
  dieErsteFuehrungsentscheidungDieIchBereutHabe,
  warumEhrlicheKiDirMehrHilftAlsEinHoeflicherChef,
  eMailsDieAutoritaetZeigenDreiRegeln,
  schwierigeNachrichtenAsyncUeberbringenSlackTeams,
  warumDieBestenChefsDieSchlechtestenMentorenSind,
  derKiKompetenzGapZwischenJuniorUndSeniorFuehrungskraeften,
  wieDuNeinSagstOhneUnbeliebtZuWerden,
  // 2026-07 · Training / Team-Training / Coaching cluster (DACH · 20 pillars)
  fuehrungskraeftetrainingKostenWasEinGutesTrainingWirklichKostet,
  teamtrainingVsEinzelcoachingWasWirktWann,
  inhouseSchulungVsOffenesSeminarEntscheidungshilfe,
  leadershipCoachingProgrammInternAufsetzenHrGuide,
  dieBestenFuehrungskraeftetrainings2026WoraufEsAnkommt,
  teambuildingVsTeamtrainingDerUnterschied,
  roiVonFuehrungskraeftetrainingMessen,
  warumInhouseTrainingsNachSechsWochenVerpuffen,
  blendedLearningFuerFuehrungskraefte,
  leadershipCoachingFuerFrauenInFuehrungspositionen,
  groupCoachingVsEinzelcoachingFuerFuehrungskraefte,
  fuehrungskraefteCurriculumFuerDenMittelstandAufbauen,
  peerCoachingInFuehrungsteams,
  ebbinghausVergessenskurveImFuehrungskraeftetraining,
  microLearningVsKlassischesSeminarFuerFuehrungskraefte,
  fuehrungskraeftetrainingMitKiSkalierenTrainTheTrainer,
  teamentwicklungNachTuckmanFuerFuehrungskraefte,
  coachingZertifizierungFuerFuehrungskraefteIcfDbvcErklaert,
  newWorkFuehrungstrainingWasSichSeitHomeofficeGeaendertHat,
  wieVieleTrainingstageBrauchtEineFuehrungskraftProJahr,

  // 2026-07-02 Reels-Serie · Wlads Kurzformat-Themen als Longform (Charisma,
  // Pitch, Motivation, Wirkung) — Quelle: wladTopics + @wlad.jachtchenko
  charismaCodeDreiSignale,
  elevatorPitchFuerFuehrungskraefte,
  mitarbeiterMotivation40,
  dieErstenSiebenSekunden,
  koerperspracheUndStimme,
  // 2026-06-29 leadership-development SEO pillars (compete with the academies)
  transformationaleFuehrung,
  lateraleFuehrung,
  fachlicheVsDisziplinarischeFuehrung,
  fuehrungskraefteentwicklung,
  // 2026-06-30 cluster articles · 2 per pillar (topical authority)
  transformationaleVsTransaktionaleFuehrung,
  transformationaleFuehrungBeispiele,
  fuehrenOhneWeisungsbefugnis,
  matrixOrganisationFuehren,
  fachlicheFuehrungOhneDisziplinarischeVerantwortung,
  fuehrungsverantwortungWasBedeutetDas,
  fuehrungskompetenzenDieWichtigsten,
  fuehrungskraeftetrainingFormateImVergleich,
  // 2026-06-26 GEO pillars · authority + definition + comparison
  werIstWladJachtchenko,
  wasIstEineKiNativeFuehrungskraft,
  leaderOsVsChatgptClaudePerplexity,
  // Narrative SEO bombs (Players'-Tribune voice, viral hooks, SEO-armored).
  // 2026-08/09 expansion · 20 SEO-armored articles
  ChatgptAlsCoPilot7PromptsFuerFuehrungskraefte,
  ClaudeVsChatgptVsGeminiWelcheKiFuerWelchenJob,
  KiHalluzinationenErkennenAlsManager,
  MitKi12StundenProWocheZurueckgewinnen,
  ScrumFuerNichtTechManager,
  OkrVsKpiWannWelcheMethode,
  EisenhowerMatrixImKiZeitalter,
  ParetoPrinzipInDerFuehrung,
  KonstruktiveKonfrontationDasBwwSkript,
  Verhandlungstaktiken5PhrasenDieDeinePositionStaerken,
  TownhallSpeechesDie7MinutenRegel,
  SchlagfertigkeitGegenManipulationDreiVerteidigungen,
  StorytellingFuerFuehrungskraeftePixarFormel,
  ImposterSyndromBeiCLevel,
  GehaltsverhandlungAlsFuehrungskraftDrehbuch,
  VomManagerZumDirectorWasWirklichAndersWird,
  BurnoutBeiTopPerformernDieWarnsignale,
  DieErsten7TageMitLeaderOs,
  SprintVsPlusPlusWelcherPfad,

    // Published 2026-08-15 → 18, so they take Hero + Top Stories on /journal.
  briefAnMeinen28JaehrigenSelbst,
  derTagAnDemIchAufhoerteZuPushen,
  dreiBurnoutsEineLektion,
  liebeMitarbeiterDasHierWollteIch,

  // Brand-new KI-Voice articles (Wlad x KI, signature launch posts).
  die5RollenEinerKiNativenFuehrungskraft,
  in6MonatenZurKiNativenFuehrungskraft,
  schlagfertigkeitImKiZeitalter,

  // KI-Paradox & der Hebel-Effekt (Top bucket · diagnostic + solution + accessibility)
  dasKiProduktivitaetsParadox,
  warumDeinChatgptTabDichNichtEffizienterMacht,
  wennDeineKiInvestitionVersickertFuenfDiagnoseFragen,
  kiToolMuedigkeitWasZuTunIst,
  outputMessenImKiZeitalter,
  wennKiDichVerlangsamt,
  warum90ProzentAllerKiTrainingsScheitern,
  kiOhneMethodikIstSlop,
  kiWissenVsKiReflex,
  dasSystemHinterDemSystem,
  damitEsJederSchafftDieZugaenglichkeitsPhilosophie,
  mehrAlsEineTransformation,
  systemStattTransformationDerKleineHebel,
  dreiRitualeDieKiInvestmentsRentabelMachen,
  derLernpfadVomKiNutzerZumKiLeader,
  mikroDrillsFuenfzehnMinutenProTag,
  kiInZehnMinutenProTag,
  fuerJedenMitarbeiterNichtNurFuerFuehrungskraefte,
  vomEinzelErfolgZumTeamSystem,
  vomPowerUserZumMultiplikator,
  dieLeaderOsKursArchitektur,
  dieKursBibliothekStrukturiertePfadeDurchLeaderOs,
  derKiSprintWasDreissigTageStrukturierteAnwendungVeraendern,
  dasVersprechenUndDieGrenzen,

  // Plattform-Hub: Why / What / Use-Cases for LeaderOS
  warumLeaderOs,
  wasInLeaderOsDrinIst,
  deinErsterTagMitLeaderOs,
  wladbotVsChatgptVsCoach,
  leaderOsFuerEngineeringLeitung,
  leaderOsFuerHrUndPeopleOps,
  leaderOsFuerScaleupGruender,
  leaderOsImTeamRollout,
  derBusinessCaseFuerLeaderOs,
  leaderOsVsKlassischesCoaching,
  leaderOsFuerMittelstandCeo,
  leaderOsFuerCtoUndTechVorstand,
  leaderOsFuerVertriebsleitung,
  leaderOsFuerNeuBefoerderteLeads,

  // Methodik + KI-Wissens-Hub
  warumFrameworksNichtImKopfBleiben,
  sprintOderMarathon,
  dieFeedbackFormelBww,
  wieLenaIhrTownhallDrehte,
  deinKalenderFuehrtDich,
  kiImFuehrungsAlltagDreiUseCases,
  chatgptAlsSparringPartnerFuenfSkripte,
  kiLeadershipWasBedeutetDasKonkret,
  kiToolsFuerFuehrungskraefte2026,
  kiStrategieFuerMittelstand,
  promptEngineeringFuerFuehrungskraefte,
  kiCoachingVsTraditionellesCoachingDach,
  mitarbeitergespraechVorbereitenMitKi,
  feedbackGebenVorlageBwwFramework,
  townhallRedeStrukturierenSexier,
  konfliktgespraechFuehrenSkript,
  kuendigungsgespraechRichtigFuehren,
  gehaltsgespraechVorbereitenSkript,
  schlagfertigkeitLernenAlsFuehrungskraft,
  dunkleRhetorikErkennenUndAbwehren,
  harvardVerhandlungsmethodeErklaert,
  schulzVonThunKommunikationsquadratFuerFuehrungskraefte,
  alpenMethodeFuerFuehrungskraefte,
  fuenfRollenDerFuehrungNachWladJachtchenko,
  dreiSaeulenDerUeberzeugungLogosEthosPathos,
  vierFarbenModellPersonalities,
  zehnStufenDesZuhoerens,
  erste100TageAlsCtoOderVpEngineering,
];

const BY_SLUG = new Map(ARTICLES.map((a) => [a.slug, a]));

/**
 * Get an article by slug. Returns null if missing or unpublished.
 */
export function getArticle(slug) {
  const found = BY_SLUG.get(slug);
  if (!found) return null;
  if (found.status && found.status !== 'published') return null;
  return found;
}

/**
 * List articles, newest first.
 *
 * @param {Object} [options]
 * @param {string} [options.type]   · filter by 'article' | 'guide' | 'field-note' | 'case-study'
 * @param {string} [options.tag]    · filter by tag (case-insensitive)
 * @param {string[]} [options.slugs]· preserve given order (used by RelatedArticles)
 * @param {number} [options.limit]
 */
export function listArticles(options = {}) {
  let out = ARTICLES.filter((a) => !a.status || a.status === 'published');

  if (options.type) {
    out = out.filter((a) => a.type === options.type);
  }
  if (options.tag) {
    const t = options.tag.toLowerCase();
    out = out.filter((a) => (a.tags ?? []).some((x) => x.toLowerCase() === t));
  }
  if (options.slugs) {
    const order = new Map(options.slugs.map((s, i) => [s, i]));
    out = out
      .filter((a) => order.has(a.slug))
      .sort((a, b) => order.get(a.slug) - order.get(b.slug));
  } else {
    out = [...out].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  }

  if (typeof options.limit === 'number') out = out.slice(0, options.limit);
  return out;
}

/**
 * The full set of unique tags across all published articles.
 */
export function listTags() {
  const set = new Set();
  for (const a of ARTICLES) {
    if (a.status && a.status !== 'published') continue;
    for (const t of a.tags ?? []) set.add(t);
  }
  return Array.from(set).sort();
}
