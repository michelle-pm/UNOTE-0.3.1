import React, { useMemo, useState, useEffect, Suspense, lazy, useCallback, createContext } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { Widget, WidgetType, PlanData, PieData, LineData, TextData, WidgetData, TitleData, ChecklistData, ImageData, ArticleData, FolderData, TableData, GoalData, FileData, Project, User, ProjectMemberRole, Comment } from '../types';
import WidgetWrapper from './WidgetWrapper';
import FolderWidget from './widgets/FolderWidget';
import CommentPane from './CommentPane';
import { WIDGET_DEFAULTS } from '../constants';
import { AnimatePresence } from 'framer-motion';

export const UnreadStatusContext = createContext<Record<string, boolean>>({});

const ResponsiveGridLayout = WidthProvider(Responsive);

// Lazy load widget components to split code and reduce build memory usage
const PlanWidget = lazy(() => import('./widgets/PlanWidget'));
const PieWidget = lazy(() => import('./widgets/PieWidget'));
const LineWidget = lazy(() => import('./widgets/LineWidget'));
const TextWidget = lazy(() => import('./widgets/TextWidget'));
const TitleWidget = lazy(() => import('./widgets/TitleWidget'));
const ChecklistWidget = lazy(() => import('./widgets/ChecklistWidget'));
const ImageWidget = lazy(() => import('./widgets/ImageWidget'));
const ArticleWidget = lazy(() => import('./widgets/ArticleWidget'));
const TableWidget = lazy(() => import('./widgets/TableWidget'));
const GoalWidget = lazy(() => import('./widgets/GoalWidget'));
const FileWidget = lazy(() => import('./widgets/FileWidget'));


interface DashboardProps {
  project: Project;
  onLayoutChange: (layout: Layout[], allLayouts: {[key: string]: Layout[]}) => void;
  onWidgetHeightChange: (widgetId: string, newH: number) => void;
  onChildrenLayoutChange: (folderId: string, allLayouts: { [key: string]: Layout[] }) => void;
  onRemoveWidget: (id: string) => void;
  onCopyWidget: (id: string) => void;
  onUpdateWidgetData: (id: string, data: WidgetData, assignedUserUid?: string | null) => void;
  onToggleFolder: (id: string) => void;
  onInitiateAddWidget: (parentId?: string) => void;
  draggingWidgetId: string | null;
  onDragStart: (layout: Layout[], oldItem: Layout) => void;
  onDragStop: () => void;
  onResizeStop: () => void;
  setDraggingWidgetId: (id: string | null) => void;
  gridCols: { [key: string]: number };
  currentUser: User | null;
  currentUserRole: ProjectMemberRole | 'owner' | null;
  projectUsers: User[];
  comments: Comment[];
  unreadStatusByWidget: Record<string, boolean>;
  activeCommentWidgetId: string | null;
  onToggleCommentPane: (widgetId: string | null) => void;
  onAddComment: (widgetId: string, content: string, mentions: string[]) => Promise<void>;
  commentsError: string | null;
  onMoveWidget: (widgetId: string, newParentId: string | null, dropPosition?: { x: number, y: number, w: number, h: number }) => void;
}

const EmptyDashboard: React.FC = () => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-4">
      <div className="max-w-md">
        <h2 className="text-3xl font-bold text-text-primary">Ваш проект пока пуст</h2>
        <p className="mt-4 text-lg text-text-secondary">
          Начните создавать свой идеальный дашборд, добавив первый виджет.
        </p>
      </div>
    </div>
);

// Memoized Grid component to prevent re-rendering on comment pane state changes
const DashboardGrid = React.memo(({
    layouts, widgets, isAnythingDragging, isOverallEditable, isMobile, gridCols,
    onLayoutChange, onDragStart, onDragStop, onResizeStop,
    onRemoveWidget, onCopyWidget, onUpdateWidgetData, onToggleFolder,
    onInitiateAddWidget, renderWidget, synchronizedWidgets, currentUser, currentUserRole,
    projectUsers, project, onToggleCommentPane, onMoveWidget, allFolders,
}: any) => {
    return (
        <ResponsiveGridLayout
            className={`layout cursor-default ${isAnythingDragging ? 'is-dragging' : ''}`}
            layouts={layouts}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={gridCols}
            rowHeight={50}
            compactType={"vertical"}
            onLayoutChange={onLayoutChange}
            onDragStart={onDragStart}
            onDragStop={onDragStop}
            onResizeStop={onResizeStop}
            draggableHandle=".drag-handle"
            draggableCancel=".no-drag, input, textarea, button, select, .nested-grid"
            isDroppable={true}
            margin={[16, 16]}
            isBounded={true}
            isDraggable={isOverallEditable && !isMobile}
            isResizable={isOverallEditable && !isMobile}
        >
            {widgets.map((widget: Widget) => {
                const isWidgetEditable = (() => {
                    if (!currentUserRole) return false;
                    if (['owner', 'editor'].includes(currentUserRole)) return true;
                    if (currentUserRole === 'manager') {
                        return widget.assignedUser === currentUser?.uid;
                    }
                    return false;
                })();
                const isFolder = widget.type === WidgetType.Folder;

                return (
                    <div key={widget.id} id={`widget-${widget.id}`} className={isFolder ? 'folder-widget' : ''} style={{ overflow: 'visible' }}>
                        <WidgetWrapper
                            widget={widget}
                            onRemove={() => onRemoveWidget(widget.id)}
                            onCopy={() => onCopyWidget(widget.id)}
                            onUpdateWidgetData={onUpdateWidgetData}
                            onToggleFolder={() => onToggleFolder(widget.id)}
                            onInitiateAddWidget={onInitiateAddWidget}
                            isNested={false}
                            currentUser={currentUser}
                            currentUserRole={currentUserRole}
                            projectUsers={projectUsers}
                            isTeamProject={project.isTeamProject}
                            isWidgetEditable={isWidgetEditable}
                            onToggleCommentPane={onToggleCommentPane}
                            onMoveWidget={onMoveWidget}
                            allFolders={allFolders}
                        >
                            <Suspense fallback={<div className="w-full h-full flex items-center justify-center text-gray-400">Загрузка виджета...</div>}>
                                {renderWidget(widget, synchronizedWidgets, isWidgetEditable)}
                            </Suspense>
                        </WidgetWrapper>
                    </div>
                )
            })}
        </ResponsiveGridLayout>
    );
});


const Dashboard: React.FC<DashboardProps> = ({ 
    project, onLayoutChange, onWidgetHeightChange, onChildrenLayoutChange, onRemoveWidget, onUpdateWidgetData, 
    onToggleFolder, onInitiateAddWidget, onCopyWidget,
    draggingWidgetId, onDragStart, onDragStop, onResizeStop, setDraggingWidgetId, gridCols,
    currentUser, currentUserRole, projectUsers,
    comments, unreadStatusByWidget, activeCommentWidgetId, onToggleCommentPane, onAddComment,
    commentsError, onMoveWidget
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const { widgets, layouts } = project;
  const [commentPanePosition, setCommentPanePosition] = useState<{ top: number; left: number; transformOrigin: string } | null>(null);

  const allFolders = useMemo(() => project.widgets.filter(w => w.type === WidgetType.Folder), [project.widgets]);

  useEffect(() => {
      const checkMobile = () => setIsMobile(window.innerWidth < 768);
      checkMobile();
      window.addEventListener('resize', checkMobile);
      return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const calculatePanePosition = useCallback(() => {
    if (activeCommentWidgetId) {
        const el = document.getElementById(`widget-${activeCommentWidgetId}`);
        if (el) {
            const rect = el.getBoundingClientRect();

            const paneWidth = 340; // from w-[340px] in CommentPane
            const paneHeight = 480; // from max-h-[480px] in CommentPane
            const margin = 16; // A safe margin from window edges
            
            let left = rect.right + margin;
            let transformOrigin = 'top left';

            // If it goes off the right edge, position it on the left
            if (left + paneWidth > window.innerWidth - margin) {
                left = rect.left - paneWidth - margin;
                transformOrigin = 'top right';
            }
            
            // Ensure it doesn't go off the left edge
            left = Math.max(margin, left);

            // Position vertically aligned to the widget's top
            let top = rect.top;
            
            // Ensure it doesn't go off the bottom edge
            if (top + paneHeight > window.innerHeight - margin) {
                top = window.innerHeight - paneHeight - margin;
            }

            // Ensure it doesn't go off the top edge
            top = Math.max(margin, top);

            setCommentPanePosition({ top, left, transformOrigin });
        }
    } else {
        setCommentPanePosition(null);
    }
  }, [activeCommentWidgetId]);

  // Recalculate on open/change.
  useEffect(() => {
    if (activeCommentWidgetId) {
      requestAnimationFrame(calculatePanePosition);
    } else {
      setCommentPanePosition(null);
    }
  }, [activeCommentWidgetId, calculatePanePosition]);

  // Recalculate on resize and scroll for fixed position adjustment
  useEffect(() => {
    if (!activeCommentWidgetId) return;
    window.addEventListener('resize', calculatePanePosition);
    window.addEventListener('scroll', calculatePanePosition, true); // Use capture to catch scroll events early
    return () => {
      window.removeEventListener('resize', calculatePanePosition);
      window.removeEventListener('scroll', calculatePanePosition, true);
    };
  }, [activeCommentWidgetId, calculatePanePosition]);

  const synchronizedWidgets = useMemo(() => {
    const widgetMap = new Map(widgets.map(w => [w.id, w]));
    return widgets.map(widget => {
      if (widget.type === WidgetType.Line) {
        const lineData = widget.data as LineData;
        const newSeries = lineData.series.map(s => {
          const newData = s.data.map(point => {
            if (point.dependency) {
              const sourceWidget = widgetMap.get(point.dependency.widgetId) as Widget | undefined;
              if (sourceWidget) { // Check if sourceWidget exists
                let sourceValue: number | undefined;

                if (sourceWidget.type === WidgetType.Plan) {
                  sourceValue = (sourceWidget.data as PlanData)[point.dependency.dataKey as 'current' | 'target'];
                } else if (sourceWidget.type === WidgetType.Pie) {
                  const pieData = sourceWidget.data as PieData;
                  // The dependency links to the FIRST pie chart in the widget
                  if (pieData.charts && pieData.charts.length > 0) {
                    const chart = pieData.charts[0];
                    sourceValue = chart[point.dependency.dataKey as 'part' | 'total'];
                  }
                }
                
                if (typeof sourceValue === 'number' && sourceValue !== point.y) {
                  return { ...point, y: sourceValue };
                }
              }
            }
            return point;
          });
          return { ...s, data: newData };
        });
        return { ...widget, data: { ...lineData, series: newSeries }};
      }
      return widget;
    });
  }, [widgets]);

  const isAnythingDragging = !!draggingWidgetId;

  const isOverallEditable = currentUserRole === 'owner' || currentUserRole === 'editor' || currentUserRole === 'manager';
  
  const handleMainDragStop = (layout: Layout[], oldItem: Layout, newItem: Layout) => {
    onDragStop();
    if (oldItem.x === newItem.x && oldItem.y === newItem.y) return;

    const draggedWidget = project.widgets.find(w => w.id === newItem.i);
    // Dragging from main grid into a folder
    if (draggedWidget && !draggedWidget.parentId) {
        const droppedOnFolder = project.widgets.find(w => {
            if (w.type !== WidgetType.Folder || w.id === newItem.i) return false;
            const folderLayout = layout.find(l => l.i === w.id);
            if (!folderLayout || (w.data as FolderData).isCollapsed) return false;
            // Collision detection
            return (
                newItem.x < folderLayout.x + folderLayout.w &&
                newItem.x + newItem.w > folderLayout.x &&
                newItem.y < folderLayout.y + folderLayout.h &&
                newItem.y + newItem.h > folderLayout.y
            );
        });

        if (droppedOnFolder) {
            onMoveWidget(newItem.i, droppedOnFolder.id);
        }
    }
  };

  const renderWidget = useCallback((widget: Widget, allWidgets: Widget[], isWidgetEditable: boolean) => {
    const updateData = (data: WidgetData) => onUpdateWidgetData(widget.id, data);
    
    switch (widget.type) {
      case WidgetType.Plan:
        return <PlanWidget data={widget.data as PlanData} updateData={updateData} isEditable={isWidgetEditable} />;
      case WidgetType.Pie:
        return <PieWidget data={widget.data as PieData} updateData={updateData} isEditable={isWidgetEditable} widgetId={widget.id} />;
      case WidgetType.Line:
        return <LineWidget data={widget.data as LineData} updateData={updateData} allWidgets={allWidgets} currentWidgetId={widget.id} isEditable={isWidgetEditable} />;
      case WidgetType.Text:
        return <TextWidget data={widget.data as TextData} updateData={updateData} isEditable={isWidgetEditable} />;
      case WidgetType.Title:
        return <TitleWidget data={widget.data as TitleData} updateData={updateData} isEditable={isWidgetEditable} />;
      case WidgetType.Checklist:
        return <ChecklistWidget data={widget.data as ChecklistData} updateData={updateData} isEditable={isWidgetEditable} />;
      case WidgetType.Image:
        return <ImageWidget data={widget.data as ImageData} updateData={updateData} isEditable={isWidgetEditable} />;
      case WidgetType.Article:
        return <ArticleWidget data={widget.data as ArticleData} updateData={updateData} isEditable={isWidgetEditable} />;
      case WidgetType.Table:
        return <TableWidget data={widget.data as TableData} updateData={updateData} isEditable={isWidgetEditable} />;
      case WidgetType.Goal:
        return <GoalWidget data={widget.data as GoalData} updateData={updateData} isEditable={isWidgetEditable} />;
      case WidgetType.File:
        return <FileWidget data={widget.data as FileData} updateData={updateData} isEditable={isWidgetEditable} />;
      case WidgetType.Folder:
        return <FolderWidget 
            widget={widget}
            allWidgets={allWidgets}
            renderWidget={renderWidget}
            onUpdateWidgetData={onUpdateWidgetData}
            onRemoveWidget={onRemoveWidget}
            onCopyWidget={onCopyWidget}
            onInitiateAddWidget={onInitiateAddWidget}
            onChildrenLayoutChange={onChildrenLayoutChange}
            onToggleFolder={onToggleFolder}
            onDragStart={onDragStart}
            onDragStop={onDragStop}
            onResizeStop={onResizeStop}
            setDraggingWidgetId={setDraggingWidgetId}
            isAnythingDragging={isAnythingDragging}
            isMobile={isMobile}
            projectUsers={projectUsers}
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            isTeamProject={project.isTeamProject}
            onToggleCommentPane={onToggleCommentPane}
            onMoveWidget={onMoveWidget}
            draggingWidgetId={draggingWidgetId}
        />;
      default:
        return <div>Unknown widget type</div>;
    }
  }, [onUpdateWidgetData, onRemoveWidget, onCopyWidget, onInitiateAddWidget, onChildrenLayoutChange, onDragStart, onDragStop, onResizeStop, setDraggingWidgetId, isAnythingDragging, isMobile, projectUsers, currentUser, currentUserRole, project, onToggleFolder, onToggleCommentPane, onMoveWidget, draggingWidgetId]);
  
  const processedLayouts = useMemo(() => {
    const newLayouts = JSON.parse(JSON.stringify(layouts));
    Object.keys(newLayouts).forEach(bp => {
      newLayouts[bp] = newLayouts[bp]?.map((item: Layout) => {
        const widget = widgets.find(w => w.id === item.i);
        if (widget) {
          const defaults = WIDGET_DEFAULTS[widget.type];
          return { ...item, minW: defaults.minW, minH: defaults.minH };
        }
        return item;
      }) || [];
    });
    
    if (draggingWidgetId) {
      const draggingWidget = widgets.find(w => w.id === draggingWidgetId);
      if (draggingWidget?.parentId) {
        const parentId = draggingWidget.parentId;
        Object.keys(newLayouts).forEach(bp => {
          const parentLayout = newLayouts[bp] as Layout[] | undefined;
          const parentItem = parentLayout?.find((l: Layout) => l.i === parentId);
          if (parentItem) {
            parentItem.isDraggable = false;
            parentItem.isResizable = false;
          }
        });
      }
    }
    return newLayouts;
  }, [layouts, widgets, draggingWidgetId]);

  const topLevelWidgets = synchronizedWidgets.filter(widget => !widget.parentId);

  if (synchronizedWidgets.length === 0) {
    return <EmptyDashboard />;
  }

  const activeWidgetForComment = activeCommentWidgetId ? widgets.find(w => w.id === activeCommentWidgetId) : null;


  return (
    <div className="h-full relative">
      <UnreadStatusContext.Provider value={unreadStatusByWidget}>
        <DashboardGrid
            layouts={processedLayouts}
            widgets={topLevelWidgets}
            isAnythingDragging={isAnythingDragging}
            isOverallEditable={isOverallEditable}
            isMobile={isMobile}
            gridCols={gridCols}
            onLayoutChange={onLayoutChange}
            onDragStart={onDragStart}
            onDragStop={handleMainDragStop}
            onResizeStop={onResizeStop}
            onRemoveWidget={onRemoveWidget}
            onCopyWidget={onCopyWidget}
            onUpdateWidgetData={onUpdateWidgetData}
            onToggleFolder={onToggleFolder}
            onInitiateAddWidget={onInitiateAddWidget}
            renderWidget={renderWidget}
            synchronizedWidgets={synchronizedWidgets}
            currentUser={currentUser}
            currentUserRole={currentUserRole}
            projectUsers={projectUsers}
            project={project}
            onToggleCommentPane={onToggleCommentPane}
            onMoveWidget={onMoveWidget}
            allFolders={allFolders}
        />

       <AnimatePresence>
        {activeCommentWidgetId && commentPanePosition && activeWidgetForComment && (
          <CommentPane
            widget={activeWidgetForComment}
            comments={comments.filter(c => c.widgetId === activeCommentWidgetId)}
            projectUsers={projectUsers}
            currentUser={currentUser}
            onAddComment={onAddComment}
            onClose={() => onToggleCommentPane(null)}
            position={commentPanePosition}
            error={commentsError}
          />
        )}
      </AnimatePresence>
      </UnreadStatusContext.Provider>
    </div>
  );
};

export default React.memo(Dashboard);