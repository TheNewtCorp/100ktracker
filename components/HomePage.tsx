import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  BarChart3,
  UsersRound,
  SearchCode,
  Target,
  BookUser,
  Watch as WatchIcon,
  CreditCard,
  Bell,
} from 'lucide-react';
import AppIcon from './AppIcon';
import FullScreenApp from './FullScreenApp';
import { Tool, AppTool, Lead, Alert, LeadStatus } from '../types';
import apiService from '../services/apiService';

import MetricsPage from './pages/MetricsPage';
import LeadsPage from './pages/LeadsPage';
import LDFPage from './pages/LDFPage';
import TPEPage from './pages/TPEPage';
import ContactsPage from './pages/ContactsPage';
import InventoryPage from './pages/InventoryPage';
import PaymentsPage from './pages/PaymentsPage';

const tools: AppTool[] = [
  { id: Tool.Metrics, title: 'Metrics', description: 'Analyze your performance.' },
  { id: Tool.Leads, title: 'Leads', description: 'Manage potential deals.' },
  { id: Tool.LDF, title: 'LDF', description: 'Find luxury deals.' },
  { id: Tool.TPE, title: 'TPE', description: 'Evaluate target prices.' },
  { id: Tool.Contacts, title: 'Contacts', description: 'Manage your contacts.' },
  { id: Tool.Inventory, title: 'Inventory', description: 'Track your watch inventory.' },
  { id: Tool.Payments, title: 'Payments', description: 'Create and manage invoices.' },
];

const icons: { [key in Tool]: React.ReactNode } = {
  [Tool.Metrics]: <BarChart3 className='w-12 h-12' />,
  [Tool.Leads]: <UsersRound className='w-12 h-12' />,
  [Tool.LDF]: <SearchCode className='w-12 h-12' />,
  [Tool.TPE]: <Target className='w-12 h-12' />,
  [Tool.Contacts]: <BookUser className='w-12 h-12' />,
  [Tool.Inventory]: <WatchIcon className='w-12 h-12' />,
  [Tool.Payments]: <CreditCard className='w-12 h-12' />,
  [Tool.AccountSettings]: '',
};

const pages: { [key in Tool]: React.ComponentType<any> } = {
  [Tool.Metrics]: MetricsPage,
  [Tool.Leads]: LeadsPage,
  [Tool.LDF]: LDFPage,
  [Tool.TPE]: TPEPage,
  [Tool.Contacts]: ContactsPage,
  [Tool.Inventory]: InventoryPage,
  [Tool.Payments]: PaymentsPage,
  [Tool.AccountSettings]: undefined,
};

const HomePage: React.FC = () => {
  const [selectedApp, setSelectedApp] = useState<AppTool | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inventoryUpdateTrigger, setInventoryUpdateTrigger] = useState(0); // Trigger for metrics refresh

  const processLeadsForAlerts = useCallback((leadsData: Lead[]) => {
    console.log('HomePage: Processing leads for alerts...', leadsData);

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    console.log('HomePage: Current date (start of today):', now);

    // Get a week from now for testing (show alerts within 7 days)
    const weekFromNow = new Date(now);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    console.log('HomePage: Week from now date:', weekFromNow);

    const upcomingAlerts: Alert[] = leadsData
      .filter((lead) => {
        if (!lead.reminderDate) {
          console.log(`HomePage: Lead "${lead.title}" has no reminder date`);
          return false;
        }
        console.log(`HomePage: Processing lead "${lead.title}" reminder date:`, lead.reminderDate);

        // Ensure date is parsed correctly, assuming YYYY-MM-DD
        const [year, month, day] = lead.reminderDate.split('-').map(Number);
        const reminderDate = new Date(year, month - 1, day);
        console.log('HomePage: Parsed reminder date:', reminderDate);

        // Show alerts for the next week for testing
        const isWithinRange = reminderDate >= now && reminderDate <= weekFromNow;
        console.log(
          `HomePage: Lead "${lead.title}" reminder ${isWithinRange ? 'IS' : 'IS NOT'} within range (${reminderDate.toDateString()} vs ${now.toDateString()} - ${weekFromNow.toDateString()})`,
        );
        return isWithinRange;
      })
      .map((lead) => ({
        id: lead.id,
        leadTitle: lead.title,
        message: `Follow up required for "${lead.title}".`,
        dueDate: lead.reminderDate!,
      }))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    console.log('HomePage: Final alerts:', upcomingAlerts);
    setAlerts(upcomingAlerts);
  }, []);

  // Load leads data on HomePage mount to populate alerts
  const loadLeadsForAlerts = useCallback(async () => {
    try {
      console.log('HomePage: Loading leads for alerts...');
      const leadsResponse = await apiService.getLeads();
      console.log('HomePage: Leads response:', leadsResponse);

      // Transform API response to match frontend interface
      const transformedLeads = leadsResponse.leads.map((lead: any) => ({
        id: lead.id.toString(),
        title: lead.title,
        status: lead.status as LeadStatus,
        contactId: lead.contact_id?.toString(),
        watchReference: lead.watch_reference,
        reminderDate: lead.reminder_date,
        notes: lead.notes,
      }));

      console.log('HomePage: Transformed leads:', transformedLeads);
      console.log(
        'HomePage: Leads with reminders:',
        transformedLeads.filter((lead) => lead.reminderDate),
      );

      setLeads(transformedLeads);
      processLeadsForAlerts(transformedLeads);
    } catch (error) {
      console.error('HomePage: Failed to load leads for alerts:', error);
      // Silently fail - alerts just won't show, but app continues to work
    }
  }, [processLeadsForAlerts]);

  // Load alerts on component mount
  useEffect(() => {
    loadLeadsForAlerts();
  }, [loadLeadsForAlerts]);

  const handleLeadsUpdate = useCallback(
    (leadsData: Lead[]) => {
      setLeads(leadsData);
      processLeadsForAlerts(leadsData);
    },
    [processLeadsForAlerts],
  );

  const handleAlertClick = useCallback((alert: Alert) => {
    console.log(`Alert clicked for lead: "${alert.leadTitle}" (ID: ${alert.id})`);
    setSelectedLeadId(alert.id);
    // Find and set the Leads tool as selected
    const leadsTool = tools.find((tool) => tool.id === Tool.Leads);
    if (leadsTool) {
      setSelectedApp(leadsTool);
    }
  }, []);

  const handleInventoryUpdate = useCallback(() => {
    console.log('HomePage: Inventory updated, triggering metrics refresh');
    setInventoryUpdateTrigger((prev) => prev + 1);
  }, []);

  const pageElement = useMemo(() => {
    if (!selectedApp) return null;
    const PageComponent = pages[selectedApp.id];

    if (selectedApp.id === Tool.Leads) {
      return <PageComponent onLeadsUpdate={handleLeadsUpdate} initialLeadId={selectedLeadId} />;
    } else if (selectedApp.id === Tool.Inventory) {
      return <PageComponent onInventoryUpdate={handleInventoryUpdate} />;
    } else if (selectedApp.id === Tool.Metrics) {
      return <PageComponent inventoryUpdateTrigger={inventoryUpdateTrigger} />;
    }

    return <PageComponent />;
  }, [selectedApp, handleLeadsUpdate, selectedLeadId, handleInventoryUpdate, inventoryUpdateTrigger]);

  return (
    <LayoutGroup>
      <div className='p-4 sm:p-8 min-h-screen'>
        <header className='text-center mb-12'>
          <h1 className='text-5xl font-bold text-champagne-gold tracking-wider'>100KTracker</h1>
          <p className='mt-2 text-platinum-silver/70 text-lg'>Dashboard</p>
        </header>

        <motion.div
          className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 max-w-7xl mx-auto'
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
          initial='hidden'
          animate='show'
        >
          {tools.map((tool) => (
            <AppIcon key={tool.id} tool={tool} icon={icons[tool.id]} onClick={() => setSelectedApp(tool)} />
          ))}
        </motion.div>

        <div className='max-w-7xl mx-auto mt-16'>
          <AnimatePresence>
            {alerts.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <h2 className='text-2xl font-semibold text-platinum-silver mb-4'>Alerts & Reminders</h2>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {alerts.slice(0, 3).map(
                    (
                      alert, // Show max 3 alerts on dashboard
                    ) => (
                      <motion.div
                        key={alert.id}
                        className='bg-charcoal-slate p-4 rounded-xl border border-champagne-gold/20 flex items-start gap-4 cursor-pointer hover:border-champagne-gold/40 hover:bg-charcoal-slate/80 transition-all duration-200'
                        layout
                        onClick={() => handleAlertClick(alert)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center bg-champagne-gold/10 text-champagne-gold rounded-full mt-1'>
                          <Bell size={18} />
                        </div>
                        <div>
                          <p className='font-bold text-platinum-silver'>{alert.leadTitle}</p>
                          <p className='text-sm text-platinum-silver/80 mt-1'>{alert.message}</p>
                          <p className='text-xs text-platinum-silver/60 mt-2 font-mono'>
                            Due:{' '}
                            {new Date(alert.dueDate).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className='text-xs text-champagne-gold/60 mt-1 italic'>Click to view lead details →</p>
                        </div>
                      </motion.div>
                    ),
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {selectedApp && (
          <FullScreenApp
            tool={selectedApp}
            onClose={() => {
              setSelectedApp(null);
              setSelectedLeadId(null); // Clear selected lead when closing app
            }}
          >
            {pageElement}
          </FullScreenApp>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
};

export default HomePage;
