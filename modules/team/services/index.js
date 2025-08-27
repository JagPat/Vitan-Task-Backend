class TeamService {
  constructor() {
    this.teams = [];
    this.members = [];
    this.invitations = [];
  }

  // Team CRUD operations
  async createTeam(teamData) {
    const team = {
      id: Date.now().toString(),
      ...teamData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.teams.push(team);
    return team;
  }

  async getTeams(filters = {}) {
    let filteredTeams = [...this.teams];
    
    if (filters.status) {
      filteredTeams = filteredTeams.filter(team => team.status === filters.status);
    }
    
    if (filters.ownerId) {
      filteredTeams = filteredTeams.filter(team => team.ownerId === filters.ownerId);
    }
    
    return filteredTeams;
  }

  async getTeamById(id) {
    return this.teams.find(team => team.id === id);
  }

  async updateTeam(id, updates) {
    const teamIndex = this.teams.findIndex(team => team.id === id);
    if (teamIndex === -1) return null;
    
    this.teams[teamIndex] = {
      ...this.teams[teamIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.teams[teamIndex];
  }

  async deleteTeam(id) {
    const teamIndex = this.teams.findIndex(team => team.id === id);
    if (teamIndex === -1) return false;
    
    this.teams.splice(teamIndex, 1);
    return true;
  }

  // Team member operations
  async addMember(teamId, memberData) {
    const member = {
      id: Date.now().toString(),
      teamId,
      ...memberData,
      joinedAt: new Date().toISOString()
    };
    this.members.push(member);
    return member;
  }

  async getTeamMembers(teamId) {
    return this.members.filter(member => member.teamId === teamId);
  }

  async removeMember(teamId, memberId) {
    const memberIndex = this.members.findIndex(member => 
      member.teamId === teamId && member.id === memberId
    );
    if (memberIndex === -1) return false;
    
    this.members.splice(memberIndex, 1);
    return true;
  }

  // Team invitation operations
  async sendInvitation(invitationData) {
    const invitation = {
      id: Date.now().toString(),
      ...invitationData,
      status: 'pending',
      sentAt: new Date().toISOString()
    };
    this.invitations.push(invitation);
    return invitation;
  }

  async getInvitations(filters = {}) {
    let filteredInvitations = [...this.invitations];
    
    if (filters.status) {
      filteredInvitations = filteredInvitations.filter(inv => inv.status === filters.status);
    }
    
    if (filters.teamId) {
      filteredInvitations = filteredInvitations.filter(inv => inv.teamId === filters.teamId);
    }
    
    return filteredInvitations;
  }

  async updateInvitation(id, updates) {
    const invitationIndex = this.invitations.findIndex(inv => inv.id === id);
    if (invitationIndex === -1) return null;
    
    this.invitations[invitationIndex] = {
      ...this.invitations[invitationIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    return this.invitations[invitationIndex];
  }

  // Team statistics
  async getTeamStats() {
    return {
      totalTeams: this.teams.length,
      totalMembers: this.members.length,
      pendingInvitations: this.invitations.filter(inv => inv.status === 'pending').length,
      activeTeams: this.teams.filter(team => team.status === 'active').length
    };
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      module: 'team',
      timestamp: new Date().toISOString(),
      services: {
        teams: this.teams.length,
        members: this.members.length,
        invitations: this.invitations.length
      }
    };
  }
}

module.exports = new TeamService();
