const express = require('express');
const teamService = require('../services');

const router = express.Router();

// Health check
router.get('/health', async (req, res) => {
  try {
    const health = await teamService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Team service health check failed' });
  }
});

// Team CRUD operations
router.post('/', async (req, res) => {
  try {
    const team = await teamService.createTeam(req.body);
    res.status(201).json(team);
  } catch (error) {
    res.status(400).json({ error: 'Failed to create team' });
  }
});

router.get('/', async (req, res) => {
  try {
    const teams = await teamService.getTeams(req.query);
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const team = await teamService.getTeamById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const team = await teamService.updateTeam(req.params.id, req.body);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update team' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await teamService.deleteTeam(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Team member operations
router.post('/:id/members', async (req, res) => {
  try {
    const member = await teamService.addMember(req.params.id, req.body);
    res.status(201).json(member);
  } catch (error) {
    res.status(400).json({ error: 'Failed to add team member' });
  }
});

router.get('/:id/members', async (req, res) => {
  try {
    const members = await teamService.getTeamMembers(req.params.id);
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team members' });
  }
});

router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const removed = await teamService.removeMember(req.params.id, req.params.memberId);
    if (!removed) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

// Team invitation operations
router.post('/:id/invitations', async (req, res) => {
  try {
    const invitation = await teamService.sendInvitation({
      ...req.body,
      teamId: req.params.id
    });
    res.status(201).json(invitation);
  } catch (error) {
    res.status(400).json({ error: 'Failed to send invitation' });
  }
});

router.get('/:id/invitations', async (req, res) => {
  try {
    const invitations = await teamService.getInvitations({ teamId: req.params.id });
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

router.put('/invitations/:invitationId', async (req, res) => {
  try {
    const invitation = await teamService.updateInvitation(req.params.invitationId, req.body);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    res.json(invitation);
  } catch (error) {
    res.status(400).json({ error: 'Failed to update invitation' });
  }
});

// Team statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const stats = await teamService.getTeamStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team statistics' });
  }
});

module.exports = router;
