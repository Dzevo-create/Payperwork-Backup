"use client";

import { useRouter, usePathname } from "next/navigation";
import { Pencil, Palette, Sofa, LucideProps } from "lucide-react";

export interface Workflow {
  id: string;
  name: string;
  icon: React.ComponentType<LucideProps>;
  route: string;
  description?: string;
}

const workflows: Workflow[] = [
  {
    id: "sketch-to-render",
    name: "Sketch to Render",
    icon: Pencil,
    route: "/workflows/sketch-to-render",
    description: "2D-Skizzen → Fotorealistische Renderings",
  },
  {
    id: "branding",
    name: "Branding",
    icon: Palette,
    route: "/workflows/branding",
    description: "Flächen → Branding-Renderings",
  },
  {
    id: "furnish-empty",
    name: "Furnish Empty",
    icon: Sofa,
    route: "/workflows/furnish-empty",
    description: "Leere Räume → Eingerichtete Räume",
  },
];

interface WorkflowListProps {
  onWorkflowClick?: (workflowId: string) => void;
}

/**
 * WorkflowList Component
 *
 * Displays list of available workflows in the sidebar
 * Currently shows: Sketch-to-Render (more workflows to be added)
 */
export function WorkflowList({ onWorkflowClick }: WorkflowListProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleWorkflowClick = (workflow: Workflow) => {
    onWorkflowClick?.(workflow.id);
    router.push(workflow.route);
  };

  return (
    <div className="space-y-1">
      {workflows.map((workflow) => {
        const Icon = workflow.icon;
        const isActive = pathname === workflow.route;

        return (
          <button
            key={workflow.id}
            onClick={() => handleWorkflowClick(workflow)}
            className={`w-full p-2 rounded-lg transition-colors duration-200 cursor-pointer ${
              isActive ? "bg-pw-light" : "hover:bg-pw-black/20"
            }`}
            title={workflow.description}
          >
            <div className="flex items-center gap-2">
              <Icon
                className="w-3.5 h-3.5 flex-shrink-0 text-pw-black/60"
                strokeWidth={1.5}
              />
              <span className="text-xs text-pw-black/80 truncate">
                {workflow.name}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
