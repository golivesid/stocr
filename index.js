import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Star, Trophy, AlertTriangle, Info } from 'lucide-react';

// Advanced ESPN Cricinfo API Service
class ESPNCricinfoApiService {
  private baseUrl = 'https://rest.cricketapi.com/rest/v2/';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetchFromApi(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.append('apikey', this.apiKey);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching from ${endpoint}:`, error);
      throw error;
    }
  }

  // Fetch Live Matches
  async fetchLiveMatches(): Promise<MatchData[]> {
    try {
      const data = await this.fetchFromApi('matches', { status: 'live' });
      
      return data.matches.map((match: any) => ({
        id: match.match_id,
        team1: {
          name: match.teams[0].name,
          shortName: match.teams[0].short_name,
          logo: match.teams[0].logo_url
        },
        team2: {
          name: match.teams[1].name,
          shortName: match.teams[1].short_name,
          logo: match.teams[1].logo_url
        },
        status: 'Live',
        matchType: match.format_str,
        venue: match.venue.name,
        series: {
          name: match.competition.name,
          season: match.competition.season
        },
        currentInnings: match.live_inning_number,
        currentScore: {
          runs: match.live_score?.runs || 0,
          wickets: match.live_score?.wickets || 0,
          overs: match.live_score?.overs || 0
        }
      }));
    } catch (error) {
      console.error('Error fetching live matches:', error);
      return [];
    }
  }

  // Fetch Upcoming Matches
  async fetchUpcomingMatches(): Promise<MatchData[]> {
    try {
      const data = await this.fetchFromApi('matches', { status: 'upcoming' });
      
      return data.matches.map((match: any) => ({
        id: match.match_id,
        team1: {
          name: match.teams[0].name,
          shortName: match.teams[0].short_name,
          logo: match.teams[0].logo_url
        },
        team2: {
          name: match.teams[1].name,
          shortName: match.teams[1].short_name,
          logo: match.teams[1].logo_url
        },
        status: 'Upcoming',
        matchType: match.format_str,
        venue: match.venue.name,
        series: {
          name: match.competition.name,
          season: match.competition.season
        },
        scheduledDate: new Date(match.start_time).toISOString(),
        scheduledTime: match.start_time
      }));
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      return [];
    }
  }

  // Fetch Past Matches
  async fetchPastMatches(): Promise<MatchData[]> {
    try {
      const data = await this.fetchFromApi('matches', { status: 'completed' });
      
      return data.matches.map((match: any) => ({
        id: match.match_id,
        team1: {
          name: match.teams[0].name,
          shortName: match.teams[0].short_name,
          logo: match.teams[0].logo_url
        },
        team2: {
          name: match.teams[1].name,
          shortName: match.teams[1].short_name,
          logo: match.teams[1].logo_url
        },
        status: 'Completed',
        matchType: match.format_str,
        venue: match.venue.name,
        series: {
          name: match.competition.name,
          season: match.competition.season
        },
        result: {
          winner: match.winner?.name || 'No Result',
          margin: match.winner_runs || match.winner_wickets
        },
        date: new Date(match.end_time).toISOString()
      }));
    } catch (error) {
      console.error('Error fetching past matches:', error);
      return [];
    }
  }

  // Fetch Detailed Match Information
  async fetchMatchDetails(matchId: string): Promise<MatchDetailsData> {
    try {
      const data = await this.fetchFromApi(`match/${matchId}`);
      const match = data.match;

      return {
        id: match.match_id,
        currentInnings: {
          battingTeam: {
            name: match.live_inning?.batting_team.name,
            logo: match.live_inning?.batting_team.logo_url
          },
          bowlingTeam: {
            name: match.live_inning?.bowling_team.name,
            logo: match.live_inning?.bowling_team.logo_url
          },
          currentScore: {
            runs: match.live_inning?.runs || 0,
            wickets: match.live_inning?.wickets || 0,
            overs: match.live_inning?.overs || 0
          },
          fallOfWickets: match.live_inning?.fow || [],
          runRate: match.live_inning?.run_rate || 0
        },
        topPerformers: {
          batsmen: match.live_inning?.top_batsmen?.map((batsman: any) => ({
            name: batsman.name,
            runs: batsman.runs,
            balls: batsman.balls,
            strikeRate: batsman.strike_rate
          })) || [],
          bowlers: match.live_inning?.top_bowlers?.map((bowler: any) => ({
            name: bowler.name,
            wickets: bowler.wickets,
            runs: bowler.runs,
            economy: bowler.economy
          })) || []
        },
        partnerships: match.live_inning?.current_partnership || null,
        powerPlay: match.live_inning?.powerplay_stats || null
      };
    } catch (error) {
      console.error(`Error fetching match details for ${matchId}:`, error);
      throw error;
    }
  }
}

// TypeScript Interfaces for Type Safety
interface TeamInfo {
  name: string;
  shortName: string;
  logo: string;
}

interface MatchData {
  id: string;
  team1: TeamInfo;
  team2: TeamInfo;
  status: string;
  matchType: string;
  venue: string;
  series: {
    name: string;
    season: string;
  };
  currentScore?: {
    runs: number;
    wickets: number;
    overs: number;
  };
  scheduledDate?: string;
  scheduledTime?: string;
  result?: {
    winner: string;
    margin?: string;
  };
  date?: string;
}

interface MatchDetailsData {
  id: string;
  currentInnings: {
    battingTeam: TeamInfo;
    bowlingTeam: TeamInfo;
    currentScore: {
      runs: number;
      wickets: number;
      overs: number;
    };
    fallOfWickets: any[];
    runRate: number;
  };
  topPerformers: {
    batsmen: {
      name: string;
      runs: number;
      balls: number;
      strikeRate: number;
    }[];
    bowlers: {
      name: string;
      wickets: number;
      runs: number;
      economy: number;
    }[];
  };
  partnerships: any;
  powerPlay: any;
}

// Create an instance of the API service
// Note: Replace with your actual API key
const cricketApiService = new ESPNCricinfoApiService('YOUR_ESPN_CRICINFO_API_KEY');

// Match Card Component
const MatchCard: React.FC<{ match: MatchData, type?: 'live' | 'upcoming' | 'past' }> = ({ 
  match, 
  type = 'live' 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [matchDetails, setMatchDetails] = useState<MatchDetailsData | null>(null);

  const handleExpand = async () => {
    if (!expanded && type === 'live') {
      try {
        const details = await cricketApiService.fetchMatchDetails(match.id);
        setMatchDetails(details);
      } catch (error) {
        console.error('Error fetching match details:', error);
      }
    }
    setExpanded(!expanded);
  };

  return (
    <Card className="mb-4 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <img 
              src={match.team1.logo} 
              alt={match.team1.name} 
              className="w-8 h-8 rounded-full"
            />
            <h3 className="text-lg font-bold">{match.team1.name} vs {match.team2.name}</h3>
            <img 
              src={match.team2.logo} 
              alt={match.team2.name} 
              className="w-8 h-8 rounded-full"
            />
          </div>
          <Badge variant={type === 'live' ? 'destructive' : 'secondary'}>
            {match.status}
          </Badge>
        </div>
        {type === 'live' && (
          <Star 
            className="text-yellow-500 cursor-pointer" 
            onClick={handleExpand} 
            size={20}
          />
        )}
      </CardHeader>
      <CardContent>
        {type === 'live' && match.currentScore && (
          <div className="text-sm">
            <p>Current Score: {match.currentScore.runs}/{match.currentScore.wickets}</p>
            <p>Overs: {match.currentScore.overs}</p>
            <p>Match Type: {match.matchType}</p>
            <p>Venue: {match.venue}</p>
            <p>Series: {match.series.name} ({match.series.season})</p>
          </div>
        )}
        {type === 'upcoming' && (
          <div className="text-sm">
            <p>Date: {new Date(match.scheduledDate || '').toLocaleDateString()}</p>
            <p>Time: {new Date(match.scheduledTime || '').toLocaleTimeString()}</p>
            <p>Match Type: {match.matchType}</p>
            <p>Venue: {match.venue}</p>
            <p>Series: {match.series.name} ({match.series.season})</p>
          </div>
        )}
        {type === 'past' && match.result && (
          <div className="text-sm">
            <p>Result: {match.result.winner} won</p>
            <p>Date: {new Date(match.date || '').toLocaleDateString()}</p>
            <p>Venue: {match.venue}</p>
            <p>Series: {match.series.name} ({match.series.season})</p>
          </div>
        )}

        {expanded && matchDetails && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center">
              <Info className="mr-2" /> Match Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium">Top Batsmen</h5>
                {matchDetails.topPerformers.batsmen.map((batsman, index) => (
                  <p key={index}>
                    {batsman.name}: {batsman.runs} ({batsman.balls} balls, SR: {batsman.strikeRate.toFixed(2)})
                  </p>
                ))}
              </div>
              <div>
                <h5 className="font-medium">Top Bowlers</h5>
                {matchDetails.topPerformers.bowlers.map((bowler, index) => (
                  <p key={index}>
                    {bowler.name}: {bowler.wickets}/{bowler.runs} (Econ: {bowler.economy.toFixed(2)})
                  </p>
                ))}
              </div>
            </div>
            {matchDetails.partnerships && (
              <div className="mt-4">
                <h5 className="font-medium">Current Partnership</h5>
                <p>
                  {matchDetails.partnerships.batsmen.map((b: any) => b.name).join(' & ')}: 
                  {matchDetails.partnerships.runs} runs
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Cricket Score App Component
const CricketScoreApp: React.FC = () => {
  const [liveMatches, setLiveMatches] = useState<MatchData[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchData[]>([]);
  const [pastMatches, setPastMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const [live, upcoming, past] = await Promise.all([
        cricketApiService.fetchLiveMatches(),
        cricketApiService.fetchUpcomingMatches(),
        cricketApiService.fetchPastMatches()
      ]);
      
      setLiveMatches(live);
      setUpcomingMatches(upcoming);
      setPastMatches(past);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setError('Failed to fetch matches. Please check your API configuration.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
    // Setup periodic refresh for live matches
    const intervalId = setInterval(fetchMatches, 60000); // Refresh every minute
    return () => clearInterval(intervalId);
  }, []);

  const renderMatchSection = (matches: MatchData[], type: 'live' | 'upcoming' | 'past') => {
    if (loading) {
      return (
        <div className="text-center py-8 flex items-center justify-center">
          <RefreshCw className="mr-2 animate-spin" />
          Loading {type} matches...
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8 text-red-500 flex items-center justify-center">
          <AlertTriangle className="mr-2" />
          {error}
        </div>
      );
    }

    if (matches.length === 0) {
      return <div className="text-center py-8">No {type} matches available</div>;
    }

    return matches.map(match => (
      <MatchCard key={match.id} match={match} type={type} />
    ));
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <Trophy className="mr-2 text-yellow-600" />
          Cricket Live Scores
        </h1>
        <button 
          onClick={fetchMatches} 
          disabled={loading}
          className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <Tabs defaultValue="live" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live">Live Matches</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past Results</TabsTrigger>
        </TabsList>
        <TabsContent value="live">
          {renderMatchSection(liveMatches, 'live')}
        </TabsContent>
        <TabsContent value="upcoming">
          {renderMatchSection(upcomingMatches, 'upcoming')}
        </TabsContent>
        <TabsContent value="past">
          {renderMatchSection(pastMatches, 'past')}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CricketScoreApp;
