import { Component } from '@angular/core';

import { ToasterService } from 'angular2-toaster';
import { Angulartics2 } from 'angulartics2';

import { ApiService } from 'jslib/abstractions/api.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { I18nService } from 'jslib/abstractions/i18n.service';

import { CipherData } from 'jslib/models/data/cipherData';
import { Cipher } from 'jslib/models/domain/cipher';
import { Organization } from 'jslib/models/domain/organization';
import { CipherCollectionsRequest } from 'jslib/models/request/cipherCollectionsRequest';

import { CollectionsComponent as BaseCollectionsComponent } from '../../vault/collections.component';

@Component({
    selector: 'app-org-vault-collections',
    templateUrl: '../../vault/collections.component.html',
})
export class CollectionsComponent extends BaseCollectionsComponent {
    organization: Organization;

    constructor(collectionService: CollectionService, analytics: Angulartics2,
        toasterService: ToasterService, i18nService: I18nService,
        cipherService: CipherService, private apiService: ApiService) {
        super(collectionService, analytics, toasterService, i18nService, cipherService);
    }

    protected async loadCipher() {
        if (!this.organization.isAdmin) {
            return await super.loadCipher();
        }
        const response = await this.apiService.getCipherAdmin(this.cipherId);
        return new Cipher(new CipherData(response));
    }

    protected loadCipherCollections() {
        if (!this.organization.isAdmin) {
            return super.loadCipherCollections();
        }
        return this.collectionIds;
    }

    protected loadCollections() {
        if (!this.organization.isAdmin) {
            return super.loadCollections();
        }
        return Promise.resolve(this.collections);
    }

    protected saveCollections() {
        const request = new CipherCollectionsRequest(this.cipherDomain.collectionIds);
        return this.apiService.putCipherCollectionsAdmin(this.cipherId, request);
    }
}
