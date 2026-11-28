import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppShell } from './components/AppShell';
import { AuthView } from './views/AuthView';
import { HomeView } from './views/HomeView';
import { QuizArenaView } from './views/QuizArenaView';
import { ArcadeView } from './views/ArcadeView';
import { LeaderboardView } from './views/LeaderboardView';
import { TeamsView } from './views/TeamsView';
import { CurriculumView } from './views/CurriculumView';
import { AudiobooksView } from './views/AudiobooksView';
import { TeamChatView } from './views/TeamChatView';
import { ProfileView } from './views/ProfileView';
import { PuzzlesView } from './views/PuzzlesView';
import { CardsView } from './views/CardsView';
import { GuessingView } from './views/GuessingView';
import { RoleplayView } from './views/RoleplayView';
import { DictionaryView } from './views/DictionaryView';

const ActiveRouteView: React.FC = () => {
  const { route, autostart, navigate } = useApp();

  useEffect(() => {
    if (autostart && route === 'auth') {
      navigate('home');
    }
  }, [autostart, navigate, route]);

  switch (route) {
    case 'auth':
      return <AuthView />;
    case 'home':
      return <HomeView />;
    case 'quiz':
      return <QuizArenaView />;
    case 'arcade':
      return <ArcadeView />;
    case 'leaderboard':
      return <LeaderboardView />;
    case 'teams':
      return <TeamsView />;
    case 'curriculum':
      return <CurriculumView />;
    case 'audiobooks':
      return <AudiobooksView />;
    case 'chat':
      return <TeamChatView />;
    case 'profile':
      return <ProfileView />;
    case 'puzzles':
      return <PuzzlesView />;
    case 'cards':
      return <CardsView />;
    case 'guessing':
      return <GuessingView />;
    case 'roleplay':
      return <RoleplayView />;
    case 'dictionary':
      return <DictionaryView />;
    default:
      return <HomeView />;
  }
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppShell>
          <ActiveRouteView />
        </AppShell>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;
