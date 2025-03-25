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
import { RefreshCw, Star, Trophy, AlertTriangle } from 'lucide-react';

// Cricbuzz API Service Configuration
class CricbuzzApiService {
  constructor() {
    // Replace with your actual RapidAPI key
    this.apiKey = 'YOUR_RAPID_API_KEY';
    this.baseUrl = 'https://cricbuzz-cricket.p.rapidapi.com';
    this.headers = {
      'X-RapidAPI-Key': this.apiKey,
      'X-RapidAPI-Host': 'cricbuzz-cricket.p.rapidapi.com'
    };
  }

  async fetchFromApi(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.headers
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

  async fetchLiveMatches() {
    try {
      const data = await this.fetchFromApi('/matches/v1/live');
      
      // Transform API response to our app's match format
      return data.typeMatches?.flatMap(typeMatch => 
        typeMatch.seriesMatches?.flatMap(seriesMatch => 
          seriesMatch.matchDetails?.map(match => ({
            id: match.matchId?.toString() || 'unknown',
            team1: match.team1?.teamName || 'Team 1',
            team2: match.team2?.teamName || 'Team 2',
            status: 'Live',
            currentScore: match.matchScoreDetails?.teamScores?.[0]?.score || 'Yet to begin',
            matchType: match.matchFormat || 'Unknown',
            venue: match.venue?.name || 'Unknown'
          })) || []
        ) || []
      ) || [];
    } catch (error) {
      console.error('Error processing live matches:', error);
      return [];
    }
  }

  async fetchUpcomingMatches() {
    try {
      const data = await this.fetchFromApi('/matches/v1/upcoming');
      
      // Transform API response to our app's match format
      return data.typeMatches?.flatMap(typeMatch => 
        typeMatch.seriesMatches?.flatMap(seriesMatch => 
          seriesMatch.matchDetails?.map(match => ({
            id: match.matchId?.toString() || 'unknown',
            team1: match.team1?.teamName || 'Team 1',
            team2: match.team2?.teamName || 'Team 2',
            status: 'Upcoming',
            date: match.startDate 
              ? new Date(parseInt(match.startDate)).toISOString().split('T')[0] 
              : 'TBA',
            time: match.startTime || 'TBA',
            matchType: match.matchFormat || 'Unknown',
            venue: match.venue?.name || 'Unknown'
          })) || []
        ) || []
      ) || [];
    } catch (error) {
      console.error('Error processing upcoming matches:', error);
      return [];
    }
  }

  async fetchPastMatches() {
    try {
      const data = await this.fetchFromApi('/matches/v1/recent');
      
      // Transform API response to our app's match format
      return data.typeMatches?.flatMap(typeMatch => 
        typeMatch.seriesMatches?.flatMap(seriesMatch => 
          seriesMatch.matchDetails?.map(match => ({
            id: match.matchId?.toString() || 'unknown',
            team1: match.team1?.teamName || 'Team 1',
            team2: match.team2?.teamName || 'Team 2',
            status: 'Completed',
            result: match.matchResult?.description || 'Match Completed',
            date: match.startDate 
              ? new Date(parseInt(match.startDate)).toISOString().split('T')[0] 
              : 'TBA',
            venue: match.venue?.name || 'Unknown'
          })) || []
        ) || []
      ) || [];
    } catch (error) {
      console.error('Error processing past matches:', error);
      return [];
    }
  }

  async fetchMatchDetails(matchId) {
    try {
      const data = await this.fetchFromApi(`/matches/v1/${matchId}/commentary`);
      
      // Transform API response to our detailed match format
      return {
        id: matchId,
        battingTeam: data.battingTeam?.teamName || 'Unknown',
        bowlingTeam: data.bowlingTeam?.teamName || 'Unknown',
        currentBatsmen: data.batsmen?.map(batsman => ({
          name: batsman.name || 'Batsman',
          runs: batsman.runs || 0,
          balls: batsman.balls || 0
        })) || [],
        currentBowlers: data.bowlers?.map(bowler => ({
          name: bowler.name || 'Bowler',
          overs: bowler.overs || 0,
          runs: bowler.runs || 0,
          wickets: bowler.wickets || 0
        })) || []
      };
    } catch (error) {
      console.error(`Error fetching match details for ${matchId}:`, error);
      throw error;
    }
  }
}

// Create an instance of the API service
const cricketApiService = new CricbuzzApiService();

// Match Card Component
const MatchCard = ({ match, type = 'live' }) => {
  const [expanded, setExpanded] = useState(false);
  const [matchDetails, setMatchDetails] = useState(null);

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
          <h3 className="text-lg font-bold">{match.team1} vs {match.team2}</h3>
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
        {type === 'live' && (
          <div className="text-sm">
            <p>Current Score: {match.currentScore}</p>
            <p>Match Type: {match.matchType}</p>
            <p>Venue: {match.venue}</p>
          </div>
        )}
        {type === 'upcoming' && (
          <div className="text-sm">
            <p>Date: {match.date}</p>
            <p>Time: {match.time}</p>
            <p>Match Type: {match.matchType}</p>
            <p>Venue: {match.venue}</p>
          </div>
        )}
        {type === 'past' && (
          <div className="text-sm">
            <p>Result: {match.result}</p>
            <p>Date: {match.date}</p>
            <p>Venue: {match.venue}</p>
          </div>
        )}

        {expanded && matchDetails && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Match Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium">Current Batsmen</h5>
                {matchDetails.currentBatsmen.map((batsman, index) => (
                  <p key={index}>{batsman.name}: {batsman.runs}({batsman.balls})</p>
                ))}
              </div>
              <div>
                <h5 className="font-medium">Current Bowlers</h5>
                {matchDetails.currentBowlers.map((bowler, index) => (
                  <p key={index}>{bowler.name}: {bowler.overs}({bowler.wickets})</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Main Cricket Score App Component
const CricketScoreApp = () => {
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [pastMatches, setPastMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const renderMatchSection = (matches, type) => {
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
