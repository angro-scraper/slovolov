import 'dart:convert';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/legacy.dart';

import 'features/audio/application/speech_service.dart';
import 'features/games/domain/letter_game_engine.dart';
import 'features/learning/application/learning_flow.dart';
import 'features/learning/application/lesson_session.dart';
import 'features/learning/data/local_learning_repository.dart';
import 'features/learning/data/serbian_letter_catalog.dart';
import 'features/learning/domain/learning_level.dart';
import 'features/learning/domain/learning_progress.dart';
import 'features/learning/domain/letter_lesson.dart';
import 'features/learning/presentation/animated_lesson_illustration.dart';
import 'features/parent/application/parent_dashboard_service.dart';
import 'features/parent/domain/audit_entry.dart';
import 'features/parent/presentation/parent_dashboard.dart';
import 'features/tracing/domain/letter_trace_guide.dart';
import 'features/settings/application/app_settings_controller.dart';

final appSettingsProvider = ChangeNotifierProvider<AppSettingsController>(
  (ref) => AppSettingsController(),
);

void main() => runApp(const ProviderScope(child: SlovoIgraApp()));

class SlovoIgraApp extends ConsumerStatefulWidget {
  const SlovoIgraApp({super.key, this.store, this.fullContentUnlocked = true});

  final ProgressStore? store;
  final bool fullContentUnlocked;

  @override
  ConsumerState<SlovoIgraApp> createState() => _SlovoIgraAppState();
}

class _SlovoIgraAppState extends ConsumerState<SlovoIgraApp> {
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  late final ProgressStore localStore;
  late final LocalLearningRepository repository;
  late final LearningFlow learningFlow;
  late final ParentDashboardService parentService;
  LearningProgress progress = const LearningProgress(childId: 'dete-1');
  int selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    localStore = widget.store ?? DeviceProgressStore();
    repository = LocalLearningRepository(localStore);
    learningFlow = LearningFlow(repository);
    parentService = ParentDashboardService(repository);
    Future<void>.microtask(
      () => ref.read(appSettingsProvider).configure(localStore),
    );
    _refreshProgress();
  }

  Future<void> _refreshProgress() async {
    final loaded = await repository.load('dete-1');
    if (mounted) setState(() => progress = loaded);
  }

  @override
  Widget build(BuildContext context) {
    final settings = ref.watch(appSettingsProvider).settings;
    return MaterialApp(
      navigatorKey: navigatorKey,
      debugShowCheckedModeBanner: false,
      title: 'Slovolov',
      theme: _buildTheme(Brightness.light),
      darkTheme: _buildTheme(Brightness.dark),
      themeMode: settings.themeMode,
      home: Scaffold(
        body: SafeArea(
          child: Semantics(
            label: 'Početni ekran edukativne aplikacije Slovolov',
            child: IndexedStack(
              index: selectedIndex,
              children: [
                _HomePage(
                  store: localStore,
                  onSelect: (index) {
                    setState(() => selectedIndex = index);
                  },
                ),
                _LettersPage(
                  flow: learningFlow,
                  fullContentUnlocked: true,
                  initialScript: settings.latinPreferred
                      ? ScriptMode.latin
                      : ScriptMode.cyrillic,
                  onProgress: (value) {
                    setState(() => progress = value);
                  },
                ),
                _RewardsPage(progress: progress),
                ParentDashboard(
                  service: parentService,
                  role: LocalRole.parent,
                  childId: 'dete-1',
                  lessons: SerbianLetterCatalog.lessons,
                  settingsController: ref.read(appSettingsProvider),
                  onReset: () async {
                    final empty = await repository.reset('dete-1');
                    if (mounted) setState(() => progress = empty);
                  },
                ),
              ],
            ),
          ),
        ),
        bottomNavigationBar: NavigationBar(
          selectedIndex: selectedIndex,
          onDestinationSelected: (value) async {
            if (value == 3 && !await _requestParentAccess()) return;
            if (!mounted) return;
            setState(() => selectedIndex = value);
            if (value == 2 || value == 3) _refreshProgress();
          },
          destinations: const [
            NavigationDestination(
              icon: Icon(Icons.home_rounded),
              label: 'Početna',
            ),
            NavigationDestination(
              icon: Icon(Icons.auto_stories_rounded),
              label: 'Slova',
            ),
            NavigationDestination(
              icon: Icon(Icons.stars_rounded),
              label: 'Nagrade',
            ),
            NavigationDestination(
              icon: Icon(Icons.family_restroom_rounded),
              label: 'Roditelji',
            ),
          ],
        ),
      ),
    );
  }

  Future<bool> _requestParentAccess() async {
    final dialogContext = navigatorKey.currentContext;
    if (dialogContext == null) return false;
    var answer = '';
    final allowed = await showDialog<bool>(
      context: dialogContext,
      builder: (context) => AlertDialog(
        title: const Text('Kutak za roditelje'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Koliko je 7 + 5?'),
            const SizedBox(height: 12),
            TextField(
              key: const ValueKey('parent-gate-answer'),
              keyboardType: TextInputType.number,
              autofocus: true,
              onChanged: (value) => answer = value,
              decoration: const InputDecoration(
                labelText: 'Odgovor odrasle osobe',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Nazad'),
          ),
          FilledButton(
            key: const ValueKey('parent-gate-confirm'),
            onPressed: () => Navigator.pop(context, answer.trim() == '12'),
            child: const Text('Otvori'),
          ),
        ],
      ),
    );
    if (allowed != true && mounted && dialogContext.mounted) {
      ScaffoldMessenger.of(dialogContext).showSnackBar(
        const SnackBar(content: Text('Roditeljski odgovor nije tačan.')),
      );
    }
    return allowed == true;
  }
}

ThemeData _buildTheme(Brightness brightness) {
  final dark = brightness == Brightness.dark;
  return ThemeData(
    brightness: brightness,
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: const Color(0xFF5B4FE9),
      brightness: brightness,
      primary: dark ? const Color(0xFFB9B3FF) : const Color(0xFF5B4FE9),
      secondary: const Color(0xFFFF6B6B),
      tertiary: const Color(0xFF00A985),
      surface: dark ? const Color(0xFF1D2030) : Colors.white,
    ),
    scaffoldBackgroundColor: dark
        ? const Color(0xFF11131E)
        : const Color(0xFFFFFCF5),
    fontFamily: 'sans-serif',
    cardTheme: CardThemeData(
      elevation: 0,
      color: dark ? const Color(0xFF1D2030) : Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(
          color: dark ? const Color(0xFF3A3F58) : const Color(0xFFE8E5F4),
        ),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size(48, 52),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      ),
    ),
    textTheme: TextTheme(
      headlineLarge: TextStyle(
        fontWeight: FontWeight.w900,
        color: dark ? Colors.white : const Color(0xFF17213A),
      ),
      titleLarge: TextStyle(
        fontWeight: FontWeight.w800,
        color: dark ? Colors.white : const Color(0xFF17213A),
      ),
    ),
  );
}

class _HomePage extends StatelessWidget {
  const _HomePage({required this.store, required this.onSelect});
  final ProgressStore store;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) => CustomScrollView(
    slivers: [
      const SliverPadding(
        padding: EdgeInsets.fromLTRB(24, 24, 24, 12),
        sliver: SliverToBoxAdapter(
          child: Row(
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF5B4FE9), Color(0xFF8C7CFF)],
                  ),
                  shape: BoxShape.circle,
                ),
                child: SizedBox(
                  width: 56,
                  height: 56,
                  child: Center(
                    child: Text(
                      'АБ',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 19,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
                ),
              ),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Slovolov',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    Text('Učimo slova kroz igru'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        sliver: SliverToBoxAdapter(
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFE9E4FF), Color(0xFFFFE7D9)],
              ),
              borderRadius: BorderRadius.circular(28),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'DNEVNA AVANTURA',
                  style: TextStyle(
                    color: Color(0xFF5145CD),
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Slovo po slovo,\nraste supermoć! ✨',
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: () => onSelect(1),
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: const Text('Uči slova'),
                ),
              ],
            ),
          ),
        ),
      ),
      SliverPadding(
        padding: const EdgeInsets.all(24),
        sliver: SliverLayoutBuilder(
          builder: (context, constraints) {
            final columns = constraints.crossAxisExtent >= 700 ? 3 : 2;
            return SliverGrid(
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: columns,
                mainAxisSpacing: 14,
                crossAxisSpacing: 14,
                childAspectRatio: columns == 3 ? 1.15 : .72,
              ),
              delegate: SliverChildListDelegate([
                _HomeCard(
                  title: 'Uči slova',
                  subtitle: 'Ćirilica i latinica',
                  icon: Icons.auto_stories_rounded,
                  colors: const [Color(0xFF635BFF), Color(0xFF877DFF)],
                  onTap: () => onSelect(1),
                ),
                _HomeCard(
                  title: 'Crtaj slova',
                  subtitle: 'Prati svetle poteze',
                  icon: Icons.gesture_rounded,
                  colors: const [Color(0xFF8B5CF6), Color(0xFFB794F4)],
                  onTap: () => onSelect(1),
                ),
                _HomeCard(
                  key: const ValueKey('home-coloring'),
                  title: 'Bojanka',
                  subtitle: 'Crtaj i stvaraj',
                  icon: Icons.palette_rounded,
                  colors: const [Color(0xFFFF6B6B), Color(0xFFFF9472)],
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => _ColoringPage(store: store),
                    ),
                  ),
                ),
                _HomeCard(
                  title: 'Reči i priče',
                  subtitle: 'Za uzrast 6–10',
                  icon: Icons.record_voice_over_rounded,
                  colors: const [Color(0xFF00A985), Color(0xFF55C99E)],
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const _WordLabPage(),
                    ),
                  ),
                ),
                _HomeCard(
                  key: const ValueKey('home-mini-games'),
                  title: 'Mini-igre',
                  subtitle: 'Tri zabavna izazova',
                  icon: Icons.sports_esports_rounded,
                  colors: const [Color(0xFFEC4899), Color(0xFFF472B6)],
                  onTap: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const _MiniGamesPage(),
                    ),
                  ),
                ),
                _HomeCard(
                  title: 'Moje nagrade',
                  subtitle: 'Zvezdice i medalje',
                  icon: Icons.stars_rounded,
                  colors: const [Color(0xFFFFB020), Color(0xFFFFD166)],
                  onTap: () => onSelect(2),
                ),
                _HomeCard(
                  title: 'Za roditelje',
                  subtitle: 'Napredak',
                  icon: Icons.family_restroom_rounded,
                  colors: const [Color(0xFF2E86DE), Color(0xFF65B7F3)],
                  onTap: () => onSelect(3),
                ),
              ]),
            );
          },
        ),
      ),
    ],
  );
}

class _HomeCard extends StatelessWidget {
  const _HomeCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.colors,
    required this.onTap,
  });
  final String title;
  final String subtitle;
  final IconData icon;
  final List<Color> colors;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => DecoratedBox(
    decoration: BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: colors,
      ),
      borderRadius: BorderRadius.circular(24),
      boxShadow: [
        BoxShadow(
          color: colors.first.withValues(alpha: .20),
          blurRadius: 18,
          offset: const Offset(0, 8),
        ),
      ],
    ),
    child: Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(24),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 30, color: Colors.white),
              const Spacer(),
              Text(
                title,
                style: Theme.of(
                  context,
                ).textTheme.titleLarge?.copyWith(color: Colors.white),
              ),
              Text(
                subtitle,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _LettersPage extends StatefulWidget {
  const _LettersPage({
    required this.flow,
    required this.fullContentUnlocked,
    required this.initialScript,
    required this.onProgress,
  });
  final LearningFlow flow;
  final bool fullContentUnlocked;
  final ScriptMode initialScript;
  final ValueChanged<LearningProgress> onProgress;

  @override
  State<_LettersPage> createState() => _LettersPageState();
}

class _LettersPageState extends State<_LettersPage> {
  late ScriptMode script;

  @override
  void initState() {
    super.initState();
    script = widget.initialScript;
  }

  @override
  void didUpdateWidget(covariant _LettersPage oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialScript != widget.initialScript) {
      script = widget.initialScript;
    }
  }

  @override
  Widget build(BuildContext context) => CustomScrollView(
    slivers: [
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 12),
        sliver: SliverToBoxAdapter(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Izaberi slovo',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              const SizedBox(height: 12),
              SegmentedButton<ScriptMode>(
                segments: const [
                  ButtonSegment(
                    value: ScriptMode.cyrillic,
                    label: Text('Ćirilica'),
                  ),
                  ButtonSegment(
                    value: ScriptMode.latin,
                    label: Text('Latinica'),
                  ),
                ],
                selected: {script},
                onSelectionChanged: (value) {
                  setState(() => script = value.first);
                },
              ),
            ],
          ),
        ),
      ),
      SliverPadding(
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
        sliver: SliverGrid.builder(
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: 110,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
          ),
          itemCount: SerbianLetterCatalog.lessons.length,
          itemBuilder: (context, index) {
            final lesson = SerbianLetterCatalog.lessons[index];
            return Semantics(
              button: true,
              label: 'Slovo ${lesson.upper(script)}, ${lesson.wordFor(script)}',
              child: FilledButton.tonal(
                onPressed: () async {
                  final result = await Navigator.of(context)
                      .push<LearningProgress>(
                        MaterialPageRoute(
                          builder: (_) => _LessonPage(
                            lesson: lesson,
                            flow: widget.flow,
                            script: script,
                            fullContentUnlocked: true,
                          ),
                        ),
                      );
                  if (result != null) widget.onProgress(result);
                },
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Text(
                      lesson.upper(script),
                      style: const TextStyle(
                        fontSize: 30,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    ],
  );
}

class _LessonPage extends ConsumerStatefulWidget {
  const _LessonPage({
    required this.lesson,
    required this.flow,
    required this.script,
    required this.fullContentUnlocked,
  });
  final LetterLesson lesson;
  final LearningFlow flow;
  final ScriptMode script;
  final bool fullContentUnlocked;

  @override
  ConsumerState<_LessonPage> createState() => _LessonPageState();
}

class _LessonPageState extends ConsumerState<_LessonPage> {
  late final LessonSession session;
  final SpeechService speech = const SpeechService();
  double accuracy = 0;
  String message = 'Prstom prati putanju slova.';
  String speechMessage = 'Dodirni zvučnik da čuješ slovo i reč.';
  bool speaking = false;
  bool tracingActive = false;
  int activeLessonPanel = 0;
  LearningProgress? completedProgress;

  @override
  void initState() {
    super.initState();
    session = widget.flow.beginLesson(
      widget.lesson,
      fullContentUnlocked: widget.fullContentUnlocked,
    );
  }

  Future<void> _finish() async {
    final submittedAccuracy = (accuracy * 100).round() / 100;
    final result = await widget.flow.completeTracing(
      childId: 'dete-1',
      lesson: widget.lesson,
      session: session,
      accuracy: submittedAccuracy,
    );
    if (!mounted) return;
    final completed = session.state == LessonSessionState.completed;
    setState(() {
      message = result.message;
      completedProgress = completed ? result.progress : null;
    });
    if (completed) {
      await _say(
        'Bravo! Naučio si slovo ${widget.lesson.cyrillicUpper}!',
        'Bravo! Osvojio/la si tri zvezdice!',
      );
    } else {
      await _say(
        'Skoro! Prati svetlu liniju sporije i pokušaj ponovo.',
        'Pokušaj ponovo, možeš ti to!',
      );
    }
  }

  void _updateAccuracy(double value) {
    setState(() {
      accuracy = value;
      message = value >= .75
          ? 'Odlično! Putanja je spremna za proveru.'
          : 'Nastavi da pratiš sve svetle poteze.';
    });
  }

  void _setTracingActive(bool active) {
    if (!mounted || tracingActive == active) return;
    setState(() => tracingActive = active);
  }

  Future<void> _say(String text, String successMessage) async {
    if (!ref.read(appSettingsProvider).settings.soundEnabled) {
      setState(() => speechMessage = 'Zvuk je isključen u podešavanjima.');
      return;
    }
    setState(() {
      speaking = true;
      speechMessage = 'Izgovaram…';
    });
    final result = await speech.speak(text);
    if (!mounted) return;
    setState(() {
      speaking = false;
      speechMessage = result.spoken
          ? successMessage
          : (result.message.isEmpty
                ? 'Srpski glas trenutno nije dostupan.'
                : result.message);
    });
  }

  Future<void> _speakLetter() => _say(
    widget.lesson.upper(widget.script),
    'Slušaj i ponovi slovo ${widget.lesson.upper(widget.script)}.',
  );

  Future<void> _speakExample() => _say(
    '${widget.lesson.upper(widget.script)}. ${widget.lesson.spokenPromptFor(widget.script)}.',
    'Slušaj i ponovi: ${widget.lesson.spokenPromptFor(widget.script)}.',
  );

  @override
  void dispose() {
    speech.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: Text(
        '${widget.lesson.upper(widget.script)} kao ${widget.lesson.wordFor(widget.script)}',
      ),
    ),
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
        child: Column(
          children: [
            SegmentedButton<int>(
              segments: const [
                ButtonSegment(value: 0, icon: Icon(Icons.menu_book_rounded), label: Text('Uči')),
                ButtonSegment(value: 1, icon: Icon(Icons.gesture_rounded), label: Text('Piši')),
              ],
              selected: {activeLessonPanel},
              onSelectionChanged: (value) => setState(() => activeLessonPanel = value.first),
            ),
            const SizedBox(height: 10),
            Expanded(
              child: activeLessonPanel == 0
                  ? _LessonOverview(
                      lesson: widget.lesson,
                      script: widget.script,
                      speaking: speaking,
                      speechMessage: speechMessage,
                      onSpeakLetter: _speakLetter,
                      onSpeakExample: _speakExample,
                      onOpenWriting: () => setState(() => activeLessonPanel = 1),
                    )
                  : Column(
                      children: [
                        Text(message, textAlign: TextAlign.center, maxLines: 2),
                        const SizedBox(height: 8),
                        _LetterTraceCanvas(
                          lesson: widget.lesson,
                          height: 230,
                          enabled: completedProgress == null,
                          onAccuracyChanged: _updateAccuracy,
                          onInteractionChanged: _setTracingActive,
                        ),
                        Semantics(
                          liveRegion: true,
                          label: '${(accuracy * 100).round()}% tačnosti',
                          child: Text('${(accuracy * 100).round()}% tačnosti', key: const ValueKey('trace-accuracy'), style: const TextStyle(fontWeight: FontWeight.w800)),
                        ),
                        const SizedBox(height: 6),
                        FilledButton.icon(
                          onPressed: completedProgress == null && accuracy > 0 ? _finish : null,
                          icon: const Icon(Icons.draw_rounded),
                          label: const Text('Proveri potez'),
                        ),
                        if (completedProgress != null) OutlinedButton(onPressed: () => Navigator.pop(context, completedProgress), child: const Text('Nazad na slova')),
                      ],
                    ),
            ),
          ],
        ),
      ),
    ),
  );
}

class _LessonOverview extends StatelessWidget {
  const _LessonOverview({required this.lesson, required this.script, required this.speaking, required this.speechMessage, required this.onSpeakLetter, required this.onSpeakExample, required this.onOpenWriting});
  final LetterLesson lesson; final ScriptMode script; final bool speaking; final String speechMessage; final VoidCallback onSpeakLetter; final VoidCallback onSpeakExample; final VoidCallback onOpenWriting;
  @override
  Widget build(BuildContext context) => Column(children: [
    Semantics(label: 'Slovo ${lesson.upper(script)}', child: Text('${lesson.upper(script)} ${lesson.lower(script)}', style: const TextStyle(fontSize: 88, fontWeight: FontWeight.w900, color: Color(0xFF6757E5)))),
    Expanded(child: Card(color: const Color(0xFFFFF1D6), child: Padding(padding: const EdgeInsets.all(14), child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
      AnimatedLessonIllustration(lesson: lesson), const SizedBox(height: 4), Text(lesson.wordFor(script), style: Theme.of(context).textTheme.headlineSmall), Text(speechMessage, textAlign: TextAlign.center, maxLines: 2),
      const SizedBox(height: 10), Wrap(alignment: WrapAlignment.center, spacing: 8, runSpacing: 8, children: [
        FilledButton.tonalIcon(onPressed: speaking ? null : onSpeakLetter, icon: const Icon(Icons.hearing_rounded), label: const Text('Čuj slovo')),
        FilledButton.tonalIcon(key: const ValueKey('speak-letter'), onPressed: speaking ? null : onSpeakExample, icon: const Icon(Icons.volume_up_rounded), label: const Text('Čuj reč')),
      ]),
    ])))),
    const SizedBox(height: 10), FilledButton.icon(onPressed: onOpenWriting, icon: const Icon(Icons.gesture_rounded), label: const Text('Piši slovo')),
  ]);
}

class _LetterTraceCanvas extends StatefulWidget {
  const _LetterTraceCanvas({
    required this.lesson,
    this.height = 300,
    required this.enabled,
    required this.onAccuracyChanged,
    required this.onInteractionChanged,
  });

  final LetterLesson lesson;
  final double height;
  final bool enabled;
  final ValueChanged<double> onAccuracyChanged;
  final ValueChanged<bool> onInteractionChanged;

  @override
  State<_LetterTraceCanvas> createState() => _LetterTraceCanvasState();
}

class _LetterTraceCanvasState extends State<_LetterTraceCanvas>
    with SingleTickerProviderStateMixin {
  final List<List<Offset>> strokes = <List<Offset>>[];
  Size canvasSize = Size.zero;
  int? activePointer;
  late final AnimationController guideController = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1800),
  )..forward();

  @override
  void dispose() {
    guideController.dispose();
    super.dispose();
  }

  Offset _insideCanvas(Offset value) => Offset(
    value.dx.clamp(0, canvasSize.width).toDouble(),
    value.dy.clamp(0, canvasSize.height).toDouble(),
  );

  void _start(PointerDownEvent event) {
    if (!widget.enabled || activePointer != null || canvasSize.isEmpty) return;
    activePointer = event.pointer;
    widget.onInteractionChanged(true);
    setState(() => strokes.add(<Offset>[_insideCanvas(event.localPosition)]));
    _reportAccuracy();
  }

  void _update(PointerMoveEvent event) {
    if (!widget.enabled ||
        strokes.isEmpty ||
        activePointer != event.pointer ||
        canvasSize.isEmpty) {
      return;
    }
    final next = _insideCanvas(event.localPosition);
    if (strokes.last.last == next) return;
    setState(() => strokes.last.add(next));
    _reportAccuracy();
  }

  void _end(PointerEvent event) {
    if (activePointer != event.pointer) return;
    activePointer = null;
    widget.onInteractionChanged(false);
  }

  void _clear() {
    setState(strokes.clear);
    widget.onAccuracyChanged(0);
  }

  void _reportAccuracy() {
    if (canvasSize.isEmpty) return;
    widget.onAccuracyChanged(
      LetterTraceGuide.forLetter(
        widget.lesson.id,
      ).accuracy(strokes, canvasSize),
    );
  }

  @override
  Widget build(BuildContext context) => Column(
    children: [
      Semantics(
        container: true,
        explicitChildNodes: true,
        label: 'Platno za pisanje slova ${widget.lesson.cyrillicUpper}',
        child: Container(
          height: widget.height,
          clipBehavior: Clip.antiAlias,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: const Color(0xFFD8D4E8)),
          ),
          child: LayoutBuilder(
            builder: (context, constraints) {
              canvasSize = constraints.biggest;
              return AnimatedBuilder(
                animation: guideController,
                builder: (context, _) => RawGestureDetector(
                  gestures: <Type, GestureRecognizerFactory>{
                    EagerGestureRecognizer:
                        GestureRecognizerFactoryWithHandlers<
                          EagerGestureRecognizer
                        >(EagerGestureRecognizer.new, (recognizer) {}),
                  },
                  child: Listener(
                    key: const ValueKey('letter-trace-canvas'),
                    behavior: HitTestBehavior.opaque,
                    onPointerDown: _start,
                    onPointerMove: _update,
                    onPointerUp: _end,
                    onPointerCancel: _end,
                    child: CustomPaint(
                      painter: _LetterTracePainter(
                        guide: LetterTraceGuide.forLetter(widget.lesson.id),
                        guideProgress: guideController.value,
                        strokes
                            .map<List<Offset>>(
                              (stroke) => List<Offset>.unmodifiable(stroke),
                            )
                            .toList(growable: false),
                      ),
                      child: const SizedBox.expand(),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ),
      const SizedBox(height: 8),
      TextButton.icon(
        onPressed: widget.enabled && strokes.isNotEmpty ? _clear : null,
        icon: const Icon(Icons.refresh_rounded),
        label: const Text('Obriši i pokušaj ponovo'),
      ),
    ],
  );
}

class _LetterTracePainter extends CustomPainter {
  const _LetterTracePainter(
    this.strokes, {
    required this.guide,
    required this.guideProgress,
  });
  final List<List<Offset>> strokes;
  final LetterTraceGuide guide;
  final double guideProgress;

  @override
  void paint(Canvas canvas, Size size) {
    final guidePaint = Paint()
      ..color = const Color(0xFFD8D4E8)
      ..strokeWidth = 18
      ..strokeCap = StrokeCap.round;
    for (final stroke in guide.scale(size)) {
      for (var index = 0; index < stroke.length - 1; index++) {
        canvas.drawLine(stroke[index], stroke[index + 1], guidePaint);
      }
    }
    final guideStrokes = guide.scale(size);
    final flatSegments = <(Offset, Offset)>[];
    for (final stroke in guideStrokes) {
      for (var index = 0; index < stroke.length - 1; index++) {
        flatSegments.add((stroke[index], stroke[index + 1]));
      }
    }
    if (flatSegments.isNotEmpty) {
      final active =
          flatSegments[(guideProgress * flatSegments.length).floor() %
              flatSegments.length];
      canvas.drawCircle(
        Offset.lerp(
          active.$1,
          active.$2,
          (guideProgress * flatSegments.length) % 1,
        )!,
        10,
        Paint()..color = const Color(0xFFFFC93C),
      );
    }
    final tracePaint = Paint()
      ..color = const Color(0xFF6757E5)
      ..strokeWidth = 12
      ..strokeCap = StrokeCap.round;
    for (final stroke in strokes) {
      for (var index = 0; index < stroke.length - 1; index++) {
        canvas.drawLine(stroke[index], stroke[index + 1], tracePaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _LetterTracePainter oldDelegate) =>
      oldDelegate.strokes != strokes ||
      oldDelegate.guide != guide ||
      oldDelegate.guideProgress != guideProgress;
}

class _WordLabPage extends StatefulWidget {
  const _WordLabPage();

  @override
  State<_WordLabPage> createState() => _WordLabPageState();
}

class _WordLabPageState extends State<_WordLabPage> {
  LearningLevel level = LearningLevel.earlySchool;
  int lessonIndex = 0;
  String feedback = 'Izaberi uzrast i istraži reči.';
  final SpeechService speech = const SpeechService();

  LetterLesson get lesson =>
      SerbianLetterCatalog.lessons[lessonIndex %
          SerbianLetterCatalog.lessons.length];

  Future<void> _speak() async {
    final text = level == LearningLevel.wordExplorer
        ? '${lesson.sentence} ${lesson.challengeQuestion}'
        : '${lesson.spokenPrompt}. ${lesson.syllables.join(' - ')}.';
    final result = await speech.speak(text);
    if (mounted) {
      setState(() {
        feedback = result.spoken
            ? 'Slušaj pažljivo, pa ponovi naglas.'
            : result.message;
      });
    }
  }

  @override
  void dispose() {
    speech.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Reči i priče')),
    body: SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          Text(
            'Učenje raste sa detetom',
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 6),
          const Text(
            'Od prepoznavanja slova do slogova, rečenica i razumevanja.',
          ),
          const SizedBox(height: 16),
          SegmentedButton<LearningLevel>(
            segments: [
              for (final item in LearningLevel.values)
                ButtonSegment(value: item, label: Text(item.label)),
            ],
            selected: {level},
            onSelectionChanged: (value) {
              setState(() => level = value.first);
            },
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFE8FFF6), Color(0xFFFFF4D6)],
              ),
              borderRadius: BorderRadius.circular(28),
            ),
            child: Column(
              children: [
                Text(lesson.emoji, style: const TextStyle(fontSize: 72)),
                Text(
                  '${lesson.cyrillicUpper} · ${lesson.word}',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  level == LearningLevel.preschool
                      ? lesson.spokenPrompt
                      : level == LearningLevel.earlySchool
                      ? 'Slogovi: ${lesson.syllables.join(' · ')}'
                      : '${lesson.sentence}\n\n${lesson.challengeQuestion}',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 18, height: 1.4),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: _speak,
                  icon: const Icon(Icons.volume_up_rounded),
                  label: const Text('Poslušaj'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text(
            feedback,
            textAlign: TextAlign.center,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 14),
          FilledButton.tonalIcon(
            onPressed: () {
              setState(() {
                lessonIndex =
                    (lessonIndex + 1) % SerbianLetterCatalog.lessons.length;
                feedback = 'Nova reč je spremna.';
              });
            },
            icon: const Icon(Icons.arrow_forward_rounded),
            label: const Text('Sledeća reč'),
          ),
        ],
      ),
    ),
  );
}

class _MiniGamesPage extends StatefulWidget {
  const _MiniGamesPage();

  @override
  State<_MiniGamesPage> createState() => _MiniGamesPageState();
}

class _MiniGamesPageState extends State<_MiniGamesPage> {
  LetterGameKind kind = LetterGameKind.matchPicture;
  late LetterGameEngine engine;
  late LetterGameRound round;
  String feedback = 'Izaberi tačan odgovor.';
  final SpeechService speech = const SpeechService();

  @override
  void initState() {
    super.initState();
    _resetGame();
  }

  void _resetGame() {
    engine = LetterGameEngine(kind: kind);
    round = engine.newRound();
    feedback = 'Izaberi tačan odgovor.';
  }

  void _answer(LetterLesson selected) {
    final result = engine.answer(round, selected);
    setState(() {
      feedback = result.message;
      if (result.correct) round = engine.newRound();
    });
    speech.speak(
      result.correct
          ? 'Bravo! Osvojio si zvezdicu.'
          : 'Pokušaj ponovo. Pronađi slovo ${round.target.cyrillicUpper}.',
    );
  }

  String get instruction => switch (kind) {
    LetterGameKind.matchPicture =>
      'Koja slika počinje slovom ${round.target.cyrillicUpper}?',
    LetterGameKind.findSpoken => 'Pronađi slovo ${round.target.cyrillicUpper}',
    LetterGameKind.balloons =>
      'Dodirni balon sa slovom ${round.target.cyrillicUpper}',
  };

  @override
  void dispose() {
    speech.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Mini-igre')),
    body: SafeArea(
      child: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          SegmentedButton<LetterGameKind>(
            segments: const [
              ButtonSegment(
                value: LetterGameKind.matchPicture,
                icon: Icon(Icons.image_search_rounded),
                label: Text('Slika'),
              ),
              ButtonSegment(
                value: LetterGameKind.findSpoken,
                icon: Icon(Icons.hearing_rounded),
                label: Text('Slovo'),
              ),
              ButtonSegment(
                value: LetterGameKind.balloons,
                icon: Icon(Icons.bubble_chart_rounded),
                label: Text('Baloni'),
              ),
            ],
            selected: {kind},
            onSelectionChanged: (value) {
              setState(() {
                kind = value.first;
                _resetGame();
              });
            },
          ),
          const SizedBox(height: 22),
          Row(
            children: [
              Expanded(
                child: Text(
                  instruction,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              if (kind == LetterGameKind.findSpoken)
                IconButton.filled(
                  tooltip: 'Ponovi izgovor',
                  onPressed: () => speech.speak(
                    'Pronađi slovo ${round.target.cyrillicUpper}.',
                  ),
                  icon: const Icon(Icons.volume_up_rounded),
                ),
            ],
          ),
          const SizedBox(height: 20),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            children: [
              for (final option in round.options)
                if (kind == LetterGameKind.balloons)
                  _BalloonOption(
                    label: option.cyrillicUpper,
                    onTap: () => _answer(option),
                  )
                else
                  FilledButton.tonal(
                    onPressed: () => _answer(option),
                    child: Text(
                      kind == LetterGameKind.matchPicture
                          ? option.emoji
                          : option.cyrillicUpper,
                      style: const TextStyle(fontSize: 48),
                    ),
                  ),
            ],
          ),
          const SizedBox(height: 16),
          Semantics(
            liveRegion: true,
            child: Text(
              feedback,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '⭐ Rezultat: ${engine.score}',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          TextButton.icon(
            onPressed: () => setState(_resetGame),
            icon: const Icon(Icons.replay_rounded),
            label: const Text('Igraj ponovo'),
          ),
        ],
      ),
    ),
  );
}

class _BalloonOption extends StatefulWidget {
  const _BalloonOption({required this.label, required this.onTap});

  final String label;
  final VoidCallback onTap;

  @override
  State<_BalloonOption> createState() => _BalloonOptionState();
}

class _BalloonOptionState extends State<_BalloonOption>
    with SingleTickerProviderStateMixin {
  late final AnimationController controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1300),
  )..repeat(reverse: true);

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: controller,
    builder: (context, child) => Transform.translate(
      offset: Offset(0, -12 * controller.value),
      child: child,
    ),
    child: Semantics(
      button: true,
      label: 'Balon sa slovom ${widget.label}',
      child: InkWell(
        onTap: widget.onTap,
        borderRadius: BorderRadius.circular(100),
        child: DecoratedBox(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFFFF6B9D), Color(0xFF8B5CF6)],
            ),
            shape: BoxShape.circle,
          ),
          child: Center(
            child: Text(
              widget.label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 48,
                fontWeight: FontWeight.w900,
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _ColoringPage extends StatefulWidget {
  const _ColoringPage({required this.store});
  final ProgressStore store;

  @override
  State<_ColoringPage> createState() => _ColoringPageState();
}

class _ColoringPageState extends State<_ColoringPage> {
  static const palette = <Color>[
    Color(0xFF6757E5),
    Color(0xFFFF735C),
    Color(0xFFFFC857),
    Color(0xFF4FC5A5),
    Color(0xFF65B7F3),
  ];
  final List<_ColoringPoint> points = <_ColoringPoint>[];
  LetterLesson lesson = SerbianLetterCatalog.lessons.first;
  Color selectedColor = palette.first;
  double brushWidth = 10;
  bool eraser = false;
  bool saved = false;
  int strokes = 0;
  bool drawingActive = false;
  int? activePointer;
  Size coloringCanvasSize = Size.zero;
  String get drawingKey => 'drawing-${lesson.id}';

  @override
  void initState() {
    super.initState();
    _restore();
  }

  Future<void> _restore() async {
    final raw = await widget.store.read(drawingKey);
    if (raw == null || raw.isEmpty) {
      if (mounted) {
        setState(() {
          points.clear();
          strokes = 0;
          saved = false;
        });
      }
      return;
    }
    final decoded = jsonDecode(raw);
    if (decoded is! List<Object?> || !mounted) return;
    final restored = <_ColoringPoint>[];
    var restoredStrokes = 0;
    for (final item in decoded) {
      if (item == null) {
        restored.add(const _ColoringPoint.separator());
        continue;
      }
      if (item is! List<Object?> || item.length != 4) continue;
      restored.add(
        _ColoringPoint(
          Offset((item[0]! as num).toDouble(), (item[1]! as num).toDouble()),
          Color((item[2]! as num).toInt()),
          (item[3]! as num).toDouble(),
        ),
      );
      if (restored.length == 1 ||
          restored[restored.length - 2].offset == null) {
        restoredStrokes += 1;
      }
    }
    setState(() {
      points
        ..clear()
        ..addAll(restored);
      strokes = restoredStrokes;
      saved = restored.isNotEmpty;
    });
  }

  Offset _insideColoringCanvas(Offset value) => Offset(
    value.dx.clamp(0, coloringCanvasSize.width).toDouble(),
    value.dy.clamp(0, coloringCanvasSize.height).toDouble(),
  );

  void _startStroke(PointerDownEvent event) {
    if (activePointer != null || coloringCanvasSize.isEmpty) return;
    activePointer = event.pointer;
    setState(() {
      points.add(
        _ColoringPoint(
          _insideColoringCanvas(event.localPosition),
          eraser ? Colors.white : selectedColor,
          eraser ? 28 : brushWidth,
        ),
      );
      strokes += 1;
      saved = false;
      drawingActive = true;
    });
  }

  void _extendStroke(PointerMoveEvent event) {
    if (activePointer != event.pointer || coloringCanvasSize.isEmpty) return;
    final next = _insideColoringCanvas(event.localPosition);
    if (points.isNotEmpty && points.last.offset == next) return;
    setState(() {
      points.add(
        _ColoringPoint(
          next,
          eraser ? Colors.white : selectedColor,
          eraser ? 28 : brushWidth,
        ),
      );
    });
  }

  void _endStroke(PointerEvent event) {
    if (activePointer != event.pointer) return;
    activePointer = null;
    setState(() {
      points.add(const _ColoringPoint.separator());
      drawingActive = false;
    });
  }

  Future<void> _clear() async {
    await widget.store.write(drawingKey, '[]');
    if (!mounted) return;
    setState(() {
      points.clear();
      strokes = 0;
      saved = false;
    });
  }

  void _undo() {
    if (points.isEmpty) return;
    setState(() {
      if (points.last.offset == null) points.removeLast();
      while (points.isNotEmpty && points.last.offset != null) {
        points.removeLast();
      }
      strokes = (strokes - 1).clamp(0, 1 << 30);
      saved = false;
    });
  }

  Future<void> _confirmClear() async {
    final first = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Obriši crtež?'),
        content: const Text('Sačuvani crtež ovog slova biće obrisan.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Odustani'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Nastavi'),
          ),
        ],
      ),
    );
    if (first != true || !mounted) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Potvrdi brisanje'),
        content: const Text('Ova radnja ne može da se vrati.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Sačuvaj'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Obriši'),
          ),
        ],
      ),
    );
    if (confirmed == true) await _clear();
  }

  Future<void> _save() async {
    if (strokes == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Nacrtaj bar jedan potez pre čuvanja.')),
      );
      return;
    }
    final encoded = points
        .map<Object?>(
          (point) => point.offset == null
              ? null
              : <Object?>[
                  point.offset!.dx,
                  point.offset!.dy,
                  point.color.toARGB32(),
                  point.width,
                ],
        )
        .toList(growable: false);
    await widget.store.write(drawingKey, jsonEncode(encoded));
    if (!mounted) return;
    setState(() => saved = true);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Crtež je trajno sačuvan na ovom uređaju.')),
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Bojanka')),
    body: SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: Column(
          children: [
            Row(
            children: [
              Expanded(
                child: Text(
                  'Bojanka po slovima',
                  style: Theme.of(context).textTheme.headlineLarge,
                ),
              ),
              DropdownButton<LetterLesson>(
                value: lesson,
                items: [
                  for (final item in SerbianLetterCatalog.lessons)
                    DropdownMenuItem(
                      value: item,
                      child: Text('${item.cyrillicUpper} ${item.emoji}'),
                    ),
                ],
                onChanged: (value) {
                  if (value == null) return;
                  setState(() => lesson = value);
                  _restore();
                },
              ),
            ],
          ),
            const SizedBox(height: 2),
            Text('Oboji: ${lesson.cyrillicUpper} kao ${lesson.wordFor(ScriptMode.cyrillic)}.', maxLines: 1),
            const SizedBox(height: 6),
            Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (final color in palette)
                Semantics(
                  button: true,
                  selected: !eraser && selectedColor == color,
                  label: 'Izaberi boju ${color.toARGB32()}',
                  child: InkWell(
                    borderRadius: BorderRadius.circular(24),
                    onTap: () => setState(() {
                      selectedColor = color;
                      eraser = false;
                    }),
                    child: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: !eraser && selectedColor == color
                              ? Colors.black
                              : Colors.transparent,
                          width: 3,
                        ),
                      ),
                    ),
                  ),
                ),
              FilterChip(
                label: const Text('Gumica'),
                avatar: const Icon(Icons.auto_fix_normal_rounded),
                selected: eraser,
                onSelected: (value) => setState(() => eraser = value),
              ),
              for (final width in const <double>[6, 12, 20])
                ChoiceChip(
                  label: Text('${width.round()}'),
                  selected: !eraser && brushWidth == width,
                  onSelected: (_) => setState(() {
                    brushWidth = width;
                    eraser = false;
                  }),
                ),
            ],
          ),
            const SizedBox(height: 8),
            Expanded(
              child: Semantics(
                label: 'Platno bojanke za ${lesson.wordFor(ScriptMode.cyrillic)}',
                child: Container(
              clipBehavior: Clip.antiAlias,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFD8D4E8)),
              ),
              child: LayoutBuilder(
                builder: (context, constraints) {
                  coloringCanvasSize = constraints.biggest;
                  return Stack(
                    fit: StackFit.expand,
                    children: [
                      Center(
                        child: Opacity(
                          opacity: .18,
                          child: Text(
                            lesson.emoji,
                            style: const TextStyle(fontSize: 170),
                          ),
                        ),
                      ),
                      RawGestureDetector(
                        gestures: <Type, GestureRecognizerFactory>{
                          EagerGestureRecognizer:
                              GestureRecognizerFactoryWithHandlers<
                                EagerGestureRecognizer
                              >(EagerGestureRecognizer.new, (recognizer) {}),
                        },
                        child: Listener(
                          key: const ValueKey('coloring-canvas'),
                          behavior: HitTestBehavior.opaque,
                          onPointerDown: _startStroke,
                          onPointerMove: _extendStroke,
                          onPointerUp: _endStroke,
                          onPointerCancel: _endStroke,
                          child: CustomPaint(
                            painter: _ColoringPainter(
                              List<_ColoringPoint>.unmodifiable(points),
                              lesson: lesson,
                            ),
                            child: const SizedBox.expand(),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
                ),
              ),
            ),
            const SizedBox(height: 6),
            Semantics(
            liveRegion: true,
            child: Text(
              saved
                  ? 'Sačuvano · $strokes poteza'
                  : '$strokes ${strokes == 1 ? 'potez' : 'poteza'}',
              key: const ValueKey('coloring-status'),
              textAlign: TextAlign.center,
            ),
            ),
            const SizedBox(height: 6),
            Wrap(
            alignment: WrapAlignment.center,
            spacing: 10,
            runSpacing: 10,
            children: [
              FilledButton.icon(
                onPressed: _save,
                icon: const Icon(Icons.save_rounded),
                label: const Text('Sačuvaj crtež'),
              ),
              OutlinedButton.icon(
                onPressed: points.isEmpty ? null : _undo,
                icon: const Icon(Icons.undo_rounded),
                label: const Text('Undo'),
              ),
              OutlinedButton.icon(
                onPressed: points.isEmpty ? null : _confirmClear,
                icon: const Icon(Icons.delete_outline_rounded),
                label: const Text('Obriši crtež'),
              ),
            ],
            ),
          ],
        ),
      ),
    ),
  );
}

class _ColoringPoint {
  const _ColoringPoint(this.offset, this.color, this.width);
  const _ColoringPoint.separator()
    : offset = null,
      color = Colors.transparent,
      width = 0;

  final Offset? offset;
  final Color color;
  final double width;
}

class _ColoringPainter extends CustomPainter {
  const _ColoringPainter(this.points, {required this.lesson});
  final List<_ColoringPoint> points;
  final LetterLesson lesson;

  @override
  void paint(Canvas canvas, Size size) {
    final letterPainter = TextPainter(
      text: TextSpan(
        text: lesson.cyrillicUpper,
        style: TextStyle(
          fontSize: size.shortestSide * .62,
          fontWeight: FontWeight.w900,
          foreground: Paint()
            ..color = const Color(0xFFD9D5E8)
            ..style = PaintingStyle.stroke
            ..strokeWidth = 5,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    letterPainter.paint(
      canvas,
      Offset(
        (size.width - letterPainter.width) / 2,
        (size.height - letterPainter.height) / 2,
      ),
    );

    for (var index = 0; index < points.length - 1; index++) {
      final current = points[index];
      final next = points[index + 1];
      if (current.offset == null || next.offset == null) continue;
      canvas.drawLine(
        current.offset!,
        next.offset!,
        Paint()
          ..color = current.color
          ..strokeWidth = current.width
          ..strokeCap = StrokeCap.round,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _ColoringPainter oldDelegate) =>
      oldDelegate.lesson.id != lesson.id ||
      oldDelegate.points.length != points.length ||
      (points.isNotEmpty && oldDelegate.points.last != points.last);
}

class _RewardsPage extends StatelessWidget {
  const _RewardsPage({required this.progress});
  final LearningProgress progress;

  static const collections = <_RewardCollection>[
    _RewardCollection(
      name: 'Životinje',
      emoji: '🦁',
      lessonIds: {'v', 'zh', 'z', 'l', 'm', 'o', 'p', 'r', 'tj', 'f'},
    ),
    _RewardCollection(name: 'Vozila', emoji: '🚀', lessonIds: {'a', 't', 'ch'}),
    _RewardCollection(name: 'Voće', emoji: '🍎', lessonIds: {'j', 'dzh'}),
    _RewardCollection(
      name: 'Priroda',
      emoji: '🌳',
      lessonIds: {'d', 'nj', 's', 'c', 'sh'},
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final learned = progress.completedLessonIds.length;
    final medal = learned >= 20
        ? 'Zlatna medalja'
        : learned >= 10
        ? 'Srebrna medalja'
        : learned >= 3
        ? 'Bronzana medalja'
        : 'Prva medalja čeka na 3 naučena slova';
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Moje nagrade', style: Theme.of(context).textTheme.headlineLarge),
        const SizedBox(height: 6),
        const Text('Svako naučeno slovo otkriva novu nalepnicu.'),
        const SizedBox(height: 16),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                const Text('⭐', style: TextStyle(fontSize: 42)),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${progress.stars} zvezdice',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      Text('$learned od 30 naučenih slova'),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(value: learned / 30),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        Card(
          child: ListTile(
            leading: Text(
              learned >= 3 ? '🏅' : '🔒',
              style: const TextStyle(fontSize: 36),
            ),
            title: Text(medal),
            subtitle: const Text('Nove medalje stižu na 3, 10 i 20 slova.'),
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Kolekcije nalepnica',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 8),
        for (final collection in collections)
          _RewardCollectionCard(
            collection: collection,
            completed: progress.completedLessonIds
                .intersection(collection.lessonIds)
                .length,
          ),
        if (learned > 0) ...[
          const SizedBox(height: 12),
          Text(
            'Osvojene nalepnice',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final lesson in SerbianLetterCatalog.lessons)
                if (progress.completedLessonIds.contains(lesson.id))
                  Chip(
                    avatar: Text(lesson.emoji),
                    label: Text('${lesson.word} nalepnica'),
                  ),
            ],
          ),
        ],
        if (learned > 0)
          Card(
            color: Theme.of(context).colorScheme.tertiaryContainer,
            child: const Padding(
              padding: EdgeInsets.all(18),
              child: Row(
                children: [
                  Text('🎉', style: TextStyle(fontSize: 38)),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Bravo! Tvoja kolekcija raste sa svakim slovom.',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class _RewardCollection {
  const _RewardCollection({
    required this.name,
    required this.emoji,
    required this.lessonIds,
  });

  final String name;
  final String emoji;
  final Set<String> lessonIds;
}

class _RewardCollectionCard extends StatelessWidget {
  const _RewardCollectionCard({
    required this.collection,
    required this.completed,
  });

  final _RewardCollection collection;
  final int completed;

  @override
  Widget build(BuildContext context) {
    final unlocked = completed == collection.lessonIds.length;
    return Card(
      child: ListTile(
        leading: Text(collection.emoji, style: const TextStyle(fontSize: 38)),
        title: Text(collection.name),
        subtitle: Text('$completed/${collection.lessonIds.length} nalepnica'),
        trailing: Chip(
          avatar: Icon(
            unlocked ? Icons.lock_open_rounded : Icons.lock_outline_rounded,
            size: 17,
          ),
          label: Text(unlocked ? 'Otključano' : 'Uči dalje'),
        ),
      ),
    );
  }
}
