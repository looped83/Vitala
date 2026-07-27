/**
 * Construction status E2E tests (Phase 7, AP7).
 * Tests progress display, completion states, and cancellation.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ConstructionProject } from '@/domain/buildings';
import { ConstructionStatus } from './ConstructionStatus';

describe('ConstructionStatus', () => {
  const mockOnCancel = vi.fn();

  const mockProject: ConstructionProject = {
    id: 'proj-1',
    householdId: 'hh-1',
    buildingDefinitionId: 'def-1',
    definitionVersion: 1,
    slotId: 'slot-1',
    regionId: 'city_center',
    initiatedBy: 'user-1',
    status: 'in_progress',
    costSnapshot: { energy: 100, food: 50, nature: 25, community: 10, building_material: 15 },
    buildPointsEarned: 0,
    buildPointsRequired: 1000,
    startedAt: '2024-01-01',
    completedAt: null,
    cancelledAt: null,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
  };

  it('displays building title and project status', () => {
    render(
      <ConstructionStatus project={mockProject} buildingTitle="Sports Hall" />,
    );

    expect(screen.getByText('Sports Hall')).toBeInTheDocument();
    expect(screen.getByText('in_progress')).toBeInTheDocument();
  });

  it('shows progress bar for active projects', () => {
    render(
      <ConstructionStatus project={mockProject} buildingTitle="Sports Hall" />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('calculates and displays progress percentage', () => {
    const projectWithProgress: ConstructionProject = {
      ...mockProject,
      buildPointsEarned: 250,
      buildPointsRequired: 1000,
    };

    render(
      <ConstructionStatus
        project={projectWithProgress}
        buildingTitle="Sports Hall"
      />,
    );

    expect(screen.getByText(/25%/i)).toBeInTheDocument();
  });

  it('displays build points earned and required', () => {
    const projectWithProgress: ConstructionProject = {
      ...mockProject,
      buildPointsEarned: 250,
      buildPointsRequired: 1000,
    };

    render(
      <ConstructionStatus
        project={projectWithProgress}
        buildingTitle="Sports Hall"
      />,
    );

    expect(screen.getByText(/250 \/ 1000 build points/i)).toBeInTheDocument();
  });

  it('shows cancel button for active projects', () => {
    render(
      <ConstructionStatus
        project={mockProject}
        buildingTitle="Sports Hall"
        onCancel={mockOnCancel}
      />,
    );

    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent?.includes('Cancel'));
    expect(cancelButton).toBeInTheDocument();
  });

  it('calls onCancel when cancel button clicked', () => {
    render(
      <ConstructionStatus
        project={mockProject}
        buildingTitle="Sports Hall"
        onCancel={mockOnCancel}
      />,
    );

    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent?.includes('Cancel'));
    if (!cancelButton) throw new Error('Cancel button not found');
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('hides cancel button when onCancel not provided', () => {
    render(
      <ConstructionStatus project={mockProject} buildingTitle="Sports Hall" />,
    );

    const buttons = screen.queryAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent?.includes('Cancel'));
    expect(cancelButton).toBeUndefined();
  });

  it('shows completion indicator when project complete', () => {
    const completedProject: ConstructionProject = {
      ...mockProject,
      status: 'completed',
      buildPointsEarned: 1000,
      buildPointsRequired: 1000,
      completedAt: '2024-02-01',
    };

    render(
      <ConstructionStatus
        project={completedProject}
        buildingTitle="Sports Hall"
        onCancel={mockOnCancel}
      />,
    );

    expect(screen.getByText(/Building complete/i)).toBeInTheDocument();
    // Icon component renders SVG with aria-hidden
    const svg = document.querySelector('svg[aria-hidden="true"]');
    expect(svg).toBeInTheDocument();
  });

  it('hides cancel button for completed projects', () => {
    const completedProject: ConstructionProject = {
      ...mockProject,
      status: 'completed',
      buildPointsEarned: 1000,
      buildPointsRequired: 1000,
      completedAt: '2024-02-01',
    };

    render(
      <ConstructionStatus
        project={completedProject}
        buildingTitle="Sports Hall"
        onCancel={mockOnCancel}
      />,
    );

    const buttons = screen.queryAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent?.includes('Cancel'));
    expect(cancelButton).toBeUndefined();
  });

  it('hides cancel button for cancelled projects', () => {
    const cancelledProject: ConstructionProject = {
      ...mockProject,
      status: 'cancelled',
      cancelledAt: '2024-01-15',
    };

    render(
      <ConstructionStatus
        project={cancelledProject}
        buildingTitle="Sports Hall"
        onCancel={mockOnCancel}
      />,
    );

    const buttons = screen.queryAllByRole('button');
    const cancelButton = buttons.find((b) => b.textContent?.includes('Cancel'));
    expect(cancelButton).toBeUndefined();
  });

  it('shows completion message for instant builds (0 required)', () => {
    const instantBuild: ConstructionProject = {
      ...mockProject,
      buildPointsRequired: 0,
      buildPointsEarned: 0,
      status: 'completed',
    };

    render(
      <ConstructionStatus project={instantBuild} buildingTitle="Sports Hall" />,
    );

    // Instant builds skip progress bar and go straight to completion
    expect(screen.getByText(/Building complete/i)).toBeInTheDocument();
    // Progress bar should not be shown for instant builds
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('uses success badge tone when complete', () => {
    const completedProject: ConstructionProject = {
      ...mockProject,
      status: 'completed',
      buildPointsEarned: 1000,
      buildPointsRequired: 1000,
      completedAt: '2024-02-01',
    };

    render(
      <ConstructionStatus
        project={completedProject}
        buildingTitle="Sports Hall"
      />,
    );

    const badge = screen.getByText('completed');
    expect(badge.className).toContain('success');
  });

  it('uses info badge tone for in-progress', () => {
    render(
      <ConstructionStatus project={mockProject} buildingTitle="Sports Hall" />,
    );

    const badge = screen.getByText('in_progress');
    expect(badge.className).toContain('info');
  });

  it('uses neutral badge tone for other statuses', () => {
    const preparedProject: ConstructionProject = {
      ...mockProject,
      status: 'prepared',
    };

    render(
      <ConstructionStatus
        project={preparedProject}
        buildingTitle="Sports Hall"
      />,
    );

    const badge = screen.getByText('prepared');
    expect(badge.className).toContain('neutral');
  });
});
