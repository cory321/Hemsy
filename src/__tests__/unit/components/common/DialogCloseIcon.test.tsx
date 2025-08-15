import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import ClientCreateDialog from '@/components/clients/ClientCreateDialog';
import ClientEditDialog from '@/components/clients/ClientEditDialog';
import ClientDeleteDialog from '@/components/clients/ClientDeleteDialog';
import PresetGarmentIconModal from '@/components/orders/PresetGarmentIconModal';

describe('Dialog close icon presence', () => {
  it('ClientCreateDialog shows a close icon in the title', () => {
    const onClose = jest.fn();
    const onCreated = jest.fn();

    render(
      <ClientCreateDialog open={true} onClose={onClose} onCreated={onCreated} />
    );

    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it('ClientEditDialog shows a close icon in the title when opened', () => {
    const client: any = {
      id: 'client_1',
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone_number: '5551234567',
      accept_email: true,
      accept_sms: false,
      notes: '',
      mailing_address: '',
    };

    render(
      <ClientEditDialog client={client}>
        <button>Open</button>
      </ClientEditDialog>
    );

    fireEvent.click(screen.getByText('Open'));
    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it('ClientDeleteDialog shows a close icon in the title when opened', () => {
    render(
      <ClientDeleteDialog clientId="c1" clientName="Test Client">
        <button>Open Delete</button>
      </ClientDeleteDialog>
    );

    fireEvent.click(screen.getByText('Open Delete'));
    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn).toBeInTheDocument();
  });

  it('PresetGarmentIconModal shows a close icon in the title', () => {
    const onClose = jest.fn();
    const onSave = jest.fn();

    render(
      <PresetGarmentIconModal
        open={true}
        onClose={onClose}
        onSave={onSave}
        initialKey={undefined}
        initialFill={undefined}
      />
    );

    const closeBtn = screen.getByRole('button', { name: /close/i });
    expect(closeBtn).toBeInTheDocument();
  });
});
