import React, { createContext, useContext, ReactNode } from 'react';
import { IRagService, IMessageService, IUIService } from '../types/interfaces';
import { ragAPI } from '../services/ragAPI';
import { MessageService } from '../services/messageService';
import { UIService } from '../services/uiService';

interface ServiceContextType {
  ragService: IRagService;
  messageService: IMessageService;
  uiService: IUIService;
}

const ServiceContext = createContext<ServiceContextType | undefined>(undefined);

interface ServiceProviderProps {
  children: ReactNode;
  ragService?: IRagService;
  messageService?: IMessageService;
  uiService?: IUIService;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({
  children,
  ragService = ragAPI,
  messageService = new MessageService(),
  uiService = new UIService(),
}) => {
  const services: ServiceContextType = {
    ragService,
    messageService,
    uiService,
  };

  return (
    <ServiceContext.Provider value={services}>
      {children}
    </ServiceContext.Provider>
  );
};

export const useServices = (): ServiceContextType => {
  const context = useContext(ServiceContext);
  if (!context) {
    throw new Error('useServices must be used within a ServiceProvider');
  }
  return context;
};